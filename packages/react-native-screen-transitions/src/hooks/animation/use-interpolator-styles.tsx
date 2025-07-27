import { useAnimatedStyle } from "react-native-reanimated";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";
import { _useRootScreenAnimation } from "../../navigator/hooks/animation/use-root-screen-animation";

export const useInterpolatorStyles = ({
	styleId,
}: {
	styleId?: string;
} = {}) => {
	const { screenStyleInterpolator, ...screenInterpolationProps } =
		_useRootScreenAnimation();

	if (__DEV__) {
		/**
		 * With react-native-worklets, we can call a fn called isWorkletFunction, we'll use this to improve the user experience to warn users that they need to mark their screenStyleInterpolator as a worklet, if not the app will crash.
		 */
	}

	const styleIdStyle = useAnimatedStyle(() => {
		"worklet";

		if (!styleId) {
			return {};
		}

		const additionalProps = additionalInterpolationProps(
			screenInterpolationProps,
		);

		const styles = screenStyleInterpolator(additionalProps)[styleId];

		return styles || {};
	});

	return {
		styleIdStyle,
	};
};
