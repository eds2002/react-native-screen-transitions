import { type StyleProps, useAnimatedStyle } from "react-native-reanimated";
import type { ScreenInterpolationProps } from "@/types";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";
import { _useScreenAnimation } from "./use-screen-animation";

const applyProperStyles = (
	styles: StyleProps | undefined,
	additionalProps: ScreenInterpolationProps,
) => {
	"worklet";
	/**
	 * Flickers are only seen on incoming screens.
	 */
	if (additionalProps.animating.value === 1 && additionalProps.isFocused) {
		if (!styles || Object.keys(styles).length === 0) {
			return { opacity: 0 };
		}
		return { ...styles, opacity: 1 };
	}
	return styles || { opacity: 1 };
};

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

		const additionalProps = additionalInterpolationProps(
			screenInterpolationProps,
		);

		const styles = screenStyleInterpolator(additionalProps)[styleId];

		return applyProperStyles(styles, additionalProps);
	});

	return {
		contentStyle,
		overlayStyle,
		styleIdStyle,
	};
};
