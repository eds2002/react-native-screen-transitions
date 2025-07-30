import { _useAnimatedStyle } from "@/navigator/hooks/animation/use-animated-style";
import { _useScreenAnimation } from "@/navigator/hooks/animation/use-screen-animation";

/**
 * This hook is used to get the associated styles for a given styleId.
 * It is used to get the associated styles for a given styleId.
 * It is used to get the associated styles for a given styleId.
 */
export const useAssociatedStyles = ({ id }: { id?: string } = {}) => {
	const { screenStyleInterpolator } = _useScreenAnimation();

	const associatedStyles = _useAnimatedStyle((props) => {
		"worklet";

		if (!id) {
			return {};
		}

		const styles = screenStyleInterpolator(props)[id] || {};

		return styles;
	});

	return { associatedStyles };
};
