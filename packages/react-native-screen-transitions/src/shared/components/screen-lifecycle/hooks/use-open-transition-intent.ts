import { useLayoutEffect } from "react";
import {
	type BaseDescriptor,
	useDescriptorDerivations,
} from "../../../providers/screen/descriptors";
import type { AnimationStoreMap } from "../../../stores/animation.store";
import {
	LifecycleTransitionRequestKind,
	type SystemStoreMap,
} from "../../../stores/system.store";
import type { SnapPoint } from "../../../types/screen.types";

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
 */
export function useOpenTransitionIntent(
	current: BaseDescriptor,
	animations: AnimationStoreMap,
	system: SystemStoreMap,
) {
	const { isFirstKey } = useDescriptorDerivations();
	const { requestLifecycleTransition } = system.actions;

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

		// When the initial snap point is 'auto', defer the opening animation until
		// ScreenContainer has measured the content and set resolvedAutoSnapPoint.
		if (initialProgress === "auto") {
			return;
		}

		requestLifecycleTransition(
			LifecycleTransitionRequestKind.Open,
			initialProgress ?? 1,
		);
	}, []);
}
