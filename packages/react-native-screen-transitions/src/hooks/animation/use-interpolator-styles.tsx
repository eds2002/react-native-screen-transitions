import { useAnimatedStyle } from "react-native-reanimated";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";
import { _useScreenAnimation } from "./use-screen-animation";

export const useInterpolatorStyles = ({
	styleId,
}: {
	styleId?: string;
} = {}) => {
	const { screenStyleInterpolator, ...screenInterpolationProps } =
		_useScreenAnimation();

	if (__DEV__) {
		/**
		 * With react-native-worklets, we can call a fn called isWorkletFunction, we'll use this to improve the user experience to warn users that they need to mark their screenStyleInterpolator as a worklet, if not the app will crash.
		 */
	}

	const contentStyle = useAnimatedStyle(() => {
		"worklet";
		const propsWithUtils = additionalInterpolationProps(
			screenInterpolationProps,
		);
		return screenStyleInterpolator(propsWithUtils).contentStyle || {};
	});

	const overlayStyle = useAnimatedStyle(() => {
		"worklet";
		const propsWithUtils = additionalInterpolationProps(
			screenInterpolationProps,
		);
		return screenStyleInterpolator(propsWithUtils).overlayStyle || {};
	});

	const styleIdStyle = useAnimatedStyle(() => {
		"worklet";

		if (!styleId) {
			return {};
		}

		const propsWithUtils = additionalInterpolationProps(
			screenInterpolationProps,
		);
		const styles = screenStyleInterpolator(propsWithUtils)[styleId] || {};

		// Only apply flicker logic to current screen, not previous/unfocused
		const isCurrentScreen = propsWithUtils.isFocused;
		const isAnimating = propsWithUtils.animating.value === 1;

		if (isCurrentScreen && isAnimating) {
			const hasCustomStyles = Object.keys(styles).length > 0;

			if (hasCustomStyles) {
				return styles;
			} else {
				return { opacity: 0 };
			}
		} else {
			if (Object.keys(styles).length > 0) {
				return styles;
			} else {
				return { opacity: 1 };
			}
		}
	});

	return {
		contentStyle,
		overlayStyle,

		styleIdStyle,
	};
};
