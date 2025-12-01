import { runOnJS } from "react-native-reanimated";
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
}

export const startScreenTransition = ({
	target,
	spec,
	onAnimationFinish,
	animations,
	initialVelocity,
}: StartScreenTransitionProps) => {
	"worklet";
	const value = target === "open" ? 1 : 0;
	const config = target === "open" ? spec?.open : spec?.close;

	const isSpringConfig =
		!!config && !("duration" in config) && !("easing" in config);

	const effectiveConfig =
		isSpringConfig && typeof initialVelocity === "number"
			? { ...config, velocity: initialVelocity }
			: config;

	const { progress, animating, closing } = animations;

	if (target === "close") {
		closing.value = 1;
	}

	if (!config) {
		animating.value = 0;
		progress.value = value;

		if (onAnimationFinish) {
			runOnJS(onAnimationFinish)(true);
		}
		return;
	}

	animating.value = 1;

	progress.value = animate(value, effectiveConfig, (finished) => {
		"worklet";
		if (finished) {
			if (onAnimationFinish) {
				runOnJS(onAnimationFinish)(finished);
			}
			animating.value = 0;
		}
	});
};
