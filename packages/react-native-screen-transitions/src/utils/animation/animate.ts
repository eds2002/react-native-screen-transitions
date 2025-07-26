import {
	type WithSpringConfig,
	type WithTimingConfig,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import type {
	AnimatableValue,
	AnimationCallback,
} from "react-native-reanimated/lib/typescript/commonTypes";

export const animate = <T extends AnimatableValue>(
	toValue: T,
	config?: WithSpringConfig | WithTimingConfig,
	callback?: AnimationCallback,
) => {
	"worklet";
	const isSpring =
		typeof config === "object" &&
		!("duration" in config) &&
		!("easing" in config);

	if (!isSpring) {
		return withTiming(toValue, config, callback);
	}

	return withSpring(toValue, config, callback);
};
