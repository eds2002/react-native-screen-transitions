import { useAnimatedStyle } from "react-native-reanimated";
import { _useScreenAnimation } from "./use-screen-animation";

const EMPTY_STYLE = Object.freeze({});
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
			return EMPTY_STYLE;
		}

		return (
			screenStyleInterpolator(screenInterpolatorProps.value)[id] || EMPTY_STYLE
		);
	});

	return { associatedStyles };
};
