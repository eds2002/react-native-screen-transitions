import { useAnimatedStyle } from "react-native-reanimated";
import { _useRootScreenAnimation } from "@/navigator/hooks/animation/use-root-screen-animation";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";

/**
 * This hook is used to get the associated styles for a given styleId.
 * It is used to get the associated styles for a given styleId.
 * It is used to get the associated styles for a given styleId.
 */
export const useAssociatedStyles = ({ id }: { id?: string } = {}) => {
	const { screenStyleInterpolator, ...screenInterpolationProps } =
		_useRootScreenAnimation();

	const associatedStyles = useAnimatedStyle(() => {
		"worklet";

		if (!id) {
			return {};
		}

		const additionalProps = additionalInterpolationProps(
			screenInterpolationProps,
		);

		const styles = screenStyleInterpolator(additionalProps)[id];

		return styles || {};
	});

	return { associatedStyles };
};
