import { useLayoutEffect } from "react";
import { useFrameCallback } from "react-native-reanimated";
import useStableCallback from "../../../hooks/use-stable-callback";
import {
	type BaseDescriptor,
	useDescriptorDerivations,
} from "../../../providers/screen/descriptors";
import type { AnimationStoreMap } from "../../../stores/animation.store";
import type { SystemStoreMap } from "../../../stores/system.store";
import type { SnapPoint } from "../../../types/screen.types";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";

/**
 * Calculates the initial progress value based on snap points configuration.
 * Returns `'auto'` if the initial snap point is the `'auto'` keyword
 * (meaning the animation must be deferred until content is measured).
 */
function getInitialProgress({
	snapPoints,
	initialSnapIndex,
}: {
	snapPoints?: SnapPoint[];
	initialSnapIndex: number;
}): number | "auto" | undefined {
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
 * Phase 1 keeps the existing v3 immediate-start behavior while moving this logic
 * into the same hook boundary used by `next`.
 */
export function useOpenTransitionIntent(
	current: BaseDescriptor,
	animations: AnimationStoreMap,
	system: SystemStoreMap,
) {
	const { isFirstKey } = useDescriptorDerivations();
	const enableHighRefreshRate =
		current.options.experimental_enableHighRefreshRate ?? false;
	const frameCallback = useFrameCallback(() => {}, false);

	const activateHighRefreshRate = useStableCallback(() => {
		if (enableHighRefreshRate) {
			frameCallback.setActive(true);
		}
	});

	const deactivateHighRefreshRate = useStableCallback(() => {
		if (enableHighRefreshRate) {
			frameCallback.setActive(false);
		}
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: Must only run once on mount
	useLayoutEffect(() => {
		const {
			snapPoints,
			initialSnapIndex = 0,
			experimental_animateOnInitialMount,
		} = current.options;

		const initialProgress = getInitialProgress({
			snapPoints,
			initialSnapIndex,
		});

		if (isFirstKey && !experimental_animateOnInitialMount) {
			if (initialProgress === "auto") {
				system.targetProgress.set(0);
				animations.progress.set(0);
			} else {
				const target = initialProgress ?? 1;
				system.targetProgress.set(target);
				animations.progress.set(target);
			}
			animations.animating.set(0);
			animations.closing.set(0);
			animations.entering.set(0);
			return;
		}

		if (initialProgress === "auto") {
			return;
		}

		activateHighRefreshRate();
		animateToProgress({
			target: initialProgress ?? "open",
			spec: current.options.transitionSpec,
			animations,
			targetProgress: system.targetProgress,
			onAnimationFinish: deactivateHighRefreshRate,
		});
	}, []);
}
