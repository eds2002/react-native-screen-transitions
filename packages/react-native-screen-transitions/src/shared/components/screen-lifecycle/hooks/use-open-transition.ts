import { useLayoutEffect } from "react";
import type { BaseDescriptor } from "../../../providers/screen/descriptors";
import type { AnimationStoreMap } from "../../../stores/animation.store";
import type { SnapPoint } from "../../../types/screen.types";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";
import { useHighRefreshRate } from "./use-high-refresh-rate";

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
 * Handles opening animation on mount.
 * Returns activate/deactivate functions for high refresh rate.
 */
export function useOpenTransition(
	current: BaseDescriptor,
	animations: AnimationStoreMap,
	isFirstKey: boolean,
) {
	const { activateHighRefreshRate, deactivateHighRefreshRate } =
		useHighRefreshRate(current);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Must only run once on mount
	useLayoutEffect(() => {
		const {
			snapPoints,
			initialSnapIndex = 0,
			experimental_animateOnInitialMount,
		} = current.options;

		const targetProgress = getInitialProgress({ snapPoints, initialSnapIndex });

		if (isFirstKey && !experimental_animateOnInitialMount) {
			if (targetProgress === "auto") {
				animations.targetProgress.set(0);
				animations.progress.set(0);
			} else {
				const target = targetProgress ?? 1;
				animations.targetProgress.set(target);
				animations.progress.set(target);
			}
			animations.animating.set(0);
			animations.closing.set(0);
			animations.entering.set(0);
			return;
		}

		// When the initial snap point is 'auto', defer the opening animation until
		// ScreenContainer has measured the content and set autoSnapPoint.
		if (targetProgress === "auto") {
			return;
		}

		activateHighRefreshRate();
		animateToProgress({
			target: targetProgress ?? "open",
			spec: current.options.transitionSpec,
			animations,
			onAnimationFinish: deactivateHighRefreshRate,
		});
	}, []);

	return { activateHighRefreshRate, deactivateHighRefreshRate };
}
