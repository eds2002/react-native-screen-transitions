import { useLayoutEffect } from "react";
import type { BaseDescriptor } from "../../providers/screen/keys.provider";
import type { AnimationStoreMap } from "../../stores/animation.store";
import { startScreenTransition } from "../../utils/animation/start-screen-transition";
import { useHighRefreshRate } from "../animation/use-high-refresh-rate";

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
		activateHighRefreshRate();
		startScreenTransition({
			target: "open",
			spec: current.options.transitionSpec,
			animations,
			onAnimationFinish: deactivateHighRefreshRate,
		});
	}, []);

	return { activateHighRefreshRate, deactivateHighRefreshRate };
}
