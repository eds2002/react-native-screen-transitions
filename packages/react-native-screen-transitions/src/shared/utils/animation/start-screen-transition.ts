import { runOnJS } from "react-native-reanimated";
import { FALSE, TRUE } from "../../constants";
import type { AnimationStoreMap } from "../../stores/animation.store";
import type { TransitionSpec } from "../../types/animation.types";
import { animate } from "./animate";

interface StartScreenTransitionProps {
	target: "open" | "close";
	spec?: TransitionSpec;
	onAnimationFinish?: (finished: boolean) => void;
	animations: AnimationStoreMap;
	/** Optional initial velocity for spring-based progress (units: progress/sec). */
	initialVelocity?: number;
	/** Optional target progress value. If provided, overrides the default 0/1 target. */
	targetProgress?: number;
}

export const startScreenTransition = ({
	target,
	spec,
	onAnimationFinish,
	animations,
	initialVelocity,
	targetProgress,
}: StartScreenTransitionProps) => {
	"worklet";
	const value = targetProgress ?? (target === "open" ? 1 : 0);
	const config = target === "open" ? spec?.open : spec?.close;

	const isSpringConfig =
		!!config && !("duration" in config) && !("easing" in config);

	const effectiveConfig =
		isSpringConfig && typeof initialVelocity === "number"
			? { ...config, velocity: initialVelocity }
			: config;

	const { progress, animating, closing, entering } = animations;

	if (target === "close") {
		closing.set(TRUE);
		entering.set(FALSE);
	} else {
		entering.set(TRUE);
	}

	if (!config) {
		animating.set(FALSE);
		progress.set(value);

		if (onAnimationFinish) {
			runOnJS(onAnimationFinish)(true);
		}
		return;
	}

	animating.set(TRUE); //<-- Do not move this into the callback
	progress.set(
		animate(value, effectiveConfig, (finished) => {
			"worklet";
			if (!finished) return;

			if (onAnimationFinish) {
				runOnJS(onAnimationFinish)(finished);
			}

			animating.set(FALSE);
		}),
	);
};
