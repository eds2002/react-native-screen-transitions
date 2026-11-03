import type { WithTimingConfig } from "react-native-reanimated";
import { type SpringConfig, withInternalSpring } from "./spring";
import type { AnimationProgressDriver, AnimationStateCallback } from "./state";
import { withInternalTiming } from "./timing";

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
	animationProgress?: AnimationProgressDriver,
) => {
	"worklet";

	if (!isSpringAnimationConfig(config)) {
		return withInternalTiming(toValue, config, callback, animationProgress);
	}

	return withInternalSpring(toValue, config, callback, animationProgress);
};
