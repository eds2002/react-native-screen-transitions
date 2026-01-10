import { useLayoutEffect } from "react";
import type { BaseDescriptor } from "../../providers/screen/keys.provider";
import type { AnimationStoreMap } from "../../stores/animation.store";
import { animateToProgress } from "../../utils/animation/animate-to-progress";
import { useHighRefreshRate } from "../animation/use-high-refresh-rate";

/**
 * Calculates the initial progress value based on snap points configuration.
 */
function getInitialProgress(
	snapPoints: number[] | "fitToContents" | undefined,
	initialSnapIndex: number,
): number | undefined {
	if (!snapPoints || snapPoints === "fitToContents") {
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
) {
	const { activateHighRefreshRate, deactivateHighRefreshRate } =
		useHighRefreshRate(current);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Must only run once on mount
	useLayoutEffect(() => {
		const { snapPoints, initialSnapIndex = 0 } = current.options;
		const targetProgress = getInitialProgress(snapPoints, initialSnapIndex);

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
