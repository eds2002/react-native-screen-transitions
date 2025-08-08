import { useAnimatedStyle } from "react-native-reanimated";
import { _useScreenAnimation } from "./use-screen-animation";

/**
 * This hook is used to get the associated styles for a given styleId.
 * It is used to get the associated styles for a given styleId.
 * It is used to get the associated styles for a given styleId.
 */
export const useAssociatedStyles = ({ id }: { id?: string } = {}) => {
	const { screenStyleInterpolator, screenInterpolatorProps } =
		_useScreenAnimation();

	const associatedStyles = useAnimatedStyle(() => {
		"worklet";

		if (!id || !screenStyleInterpolator) {
			return {};
		}

		return screenStyleInterpolator(screenInterpolatorProps.value)[id] || {};
	});

	return { associatedStyles };
};
