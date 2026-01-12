import type { SharedValue } from "react-native-reanimated";
import { runOnJS, runOnUI } from "react-native-reanimated";
import { FALSE, TRUE } from "../../constants";
import type { AnimationStoreMap } from "../../stores/animation.store";
import type { TransitionSpec } from "../../types/animation.types";
import { animate } from "./animate";

/**
 * Sets the settled value to TRUE after one frame.
 * This ensures the final animation frame has been painted before marking as settled.
 */
const setSettledAfterFrame = (settled: SharedValue<number>) => {
	requestAnimationFrame(() => {
		runOnUI(() => {
			"worklet";
			settled.value = TRUE;
		})();
	});
};

interface AnimateToProgressProps {
	/**
	 * Target for the animation:
	 * - "open" = animate to progress 1
	 * - "close" = animate to progress 0
	 * - number = animate to specific progress value (e.g., 0.5 for snap point)
	 */
	target: "open" | "close" | number;
	spec?: TransitionSpec;
	onAnimationFinish?: (finished: boolean) => void;
	animations: AnimationStoreMap;
	/** Optional initial velocity for spring-based progress (units: progress/sec). */
	initialVelocity?: number;
}

export const animateToProgress = ({
	target,
	spec,
	onAnimationFinish,
	animations,
	initialVelocity,
}: AnimateToProgressProps) => {
	"worklet";

	// Determine target value and direction
	const isClosing =
		target === "close" || (typeof target === "number" && target === 0);
	const value = typeof target === "number" ? target : target === "open" ? 1 : 0;

	// Select spec based on direction (closing uses close spec, otherwise open)
	const config = isClosing ? spec?.close : spec?.open;

	const isSpringConfig =
		!!config && !("duration" in config) && !("easing" in config);

	const effectiveConfig =
		isSpringConfig && typeof initialVelocity === "number"
			? { ...config, velocity: initialVelocity }
			: config;

	const { progress, animating, closing, entering, settled } = animations;

	if (isClosing) {
		closing.set(TRUE);
		entering.set(FALSE);
	} else {
		entering.set(TRUE);
	}

	if (!config) {
		animating.set(FALSE);
		settled.set(TRUE);
		progress.set(value);

		if (onAnimationFinish) {
			runOnJS(onAnimationFinish)(true);
		}
		return;
	}

	animating.set(TRUE); //<-- Do not move this into the callback
	settled.set(FALSE);
	progress.set(
		animate(value, effectiveConfig, (finished) => {
			"worklet";
			if (!finished) return;

			if (onAnimationFinish) {
				runOnJS(onAnimationFinish)(finished);
			}

			animating.set(FALSE);
			runOnJS(setSettledAfterFrame)(settled);
		}),
	);
};
