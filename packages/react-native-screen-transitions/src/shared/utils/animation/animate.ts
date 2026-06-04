import type { WithTimingConfig } from "react-native-reanimated";
import { withTiming } from "react-native-reanimated";
import { type SpringConfig, withInternalSpring } from "./spring";
import type { AnimationStateCallback } from "./state";

export type TimingAnimationConfig = WithTimingConfig;
export type SpringAnimationConfig = SpringConfig;
export type ScreenAnimationConfig =
	| SpringAnimationConfig
	| TimingAnimationConfig;

export const isSpringAnimationConfig = (
	config: ScreenAnimationConfig | undefined,
): config is SpringAnimationConfig => {
	"worklet";
	if (typeof config !== "object" || config === null) {
		return false;
	}

	return (
		"stiffness" in config ||
		"damping" in config ||
		"mass" in config ||
		"velocity" in config ||
		"overshootClamping" in config ||
		"energyThreshold" in config ||
		"dampingRatio" in config ||
		"clamp" in config
	);
};

export const animate = (
	toValue: number,
	config?: ScreenAnimationConfig,
	callback?: AnimationStateCallback,
) => {
	"worklet";

	if (!isSpringAnimationConfig(config)) {
		return withTiming(toValue, config, (finished) => {
			"worklet";
			const didFinish = finished === true;
			callback?.({
				finished: didFinish,
				settled: didFinish,
			});
		});
	}

	return withInternalSpring(toValue, config, callback);
};
