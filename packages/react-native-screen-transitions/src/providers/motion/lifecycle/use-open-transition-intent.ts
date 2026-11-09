import { useLayoutEffect, useRef } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { AnimationProgress, EPSILON } from "../../../constants";
import useStableCallback from "../../../hooks/use-stable-callback";
import type { SnapPoint } from "../../../types/screen.types";
import { type BaseDescriptor, useBuilderStore } from "../../builder";
import { LifecycleTransitionRequestKind } from "../hooks/use-transition-values";
import type { MotionValues } from "../types";

/**
 * Calculates the initial progress value based on snap points configuration.
 * Returns `'auto'` if the initial snap point is the `'auto'` keyword
 * (meaning the animation must be deferred until content is measured).
 */
export function getInitialProgress({
	snapPoints,
	initialSnapIndex,
}: {
	snapPoints?: SnapPoint[];
	initialSnapIndex: number;
}): SnapPoint | undefined {
	if (!snapPoints) {
		return undefined;
	}

	const clampedIndex = Math.min(
		Math.max(0, initialSnapIndex),
		snapPoints.length - 1,
	);
	return snapPoints[clampedIndex];
}

/**
 * Handles opening transition intent on mount.
 *
 * `"mount"` (a navigator's screens): a screen that starts settled sits at its initial snap point,
 * any other screen opens. `"closed"` (a unit that opens on request): it stays closed and
 * hidden, and its first `'auto'` measurement doesn't open it.
 */
export function useOpenTransitionIntent(
	current: BaseDescriptor,
	values: MotionValues,
	onComplete?: () => void,
	mode: "mount" | "closed" = "mount",
) {
	const initialized = useRef(false);
	const startsSettled = useBuilderStore(
		(store) => store.derivations.startsSettled,
	);
	const { requestLifecycleTransition } = values.actions;
	const completeOpen = useStableCallback(() => {
		onComplete?.();
	});
	const { closing, entering, progressSettled, transitionProgress } = values;

	// An open has finished once it settles above zero, at whatever snap point it opened to.
	// Already open at mount (a screen that starts settled) isn't an open finishing.
	useAnimatedReaction(
		() => {
			"worklet";
			return (
				!closing.get() &&
				!entering.get() &&
				!!progressSettled.get() &&
				transitionProgress.get() > EPSILON
			);
		},
		(open, wasOpen) => {
			"worklet";
			if (open && wasOpen === false) {
				scheduleOnRN(completeOpen);
			}
		},
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Must only run once on mount
	useLayoutEffect(() => {
		// TODO: Find a cleaner way to handle effect setup and resumption across Activity pauses.
		// Activity reconnects effects when a retained screen becomes visible again.
		if (initialized.current) {
			// Activity cleanup cancels shared-value animations; resume only unfinished opens.
			scheduleOnUI(() => {
				"worklet";
				if (
					values.entering.get() &&
					!values.closing.get() &&
					!values.progressSettled.get() &&
					values.pendingLifecycleRequestKind.get() ===
						LifecycleTransitionRequestKind.None
				) {
					requestLifecycleTransition(
						LifecycleTransitionRequestKind.Open,
						values.targetProgress.get(),
					);
				}
			});
			return;
		}
		initialized.current = true;

		if (mode === "closed") {
			values.autoOpenArmed.set(0);
			return;
		}

		const { snapPoints, initialSnapIndex = 0 } = current.options;

		const initialProgress = getInitialProgress({
			snapPoints,
			initialSnapIndex,
		});

		if (startsSettled) {
			if (typeof initialProgress === "string") {
				values.targetProgress.set(0);
				values.transitionProgress.set(0);
			} else {
				const target = initialProgress ?? AnimationProgress.Visible;
				values.targetProgress.set(target);
				values.transitionProgress.set(target);
			}
			values.progressAnimating.set(0);
			values.closing.set(0);
			values.entering.set(0);
			return;
		}

		// When the initial snap point is 'auto', defer the opening animation until
		// ScreenLayers has measured the content and set resolvedAutoSnapPoint.
		if (typeof initialProgress === "string") {
			return;
		}

		values.entering.set(1);
		requestLifecycleTransition(
			LifecycleTransitionRequestKind.Open,
			initialProgress ?? AnimationProgress.Visible,
		);
	}, []);
}
