import { useAnimatedStyle } from "react-native-reanimated";
import { useTransitionStyles } from "../../providers/transition-styles";

type Props = {
	id?: string;
};

const EMPTY_STYLE = Object.freeze({});

/**
 * This hook is used to get the associated styles for a given styleId / boundTag.
 */
export const useAssociatedStyles = ({ id }: Props = {}) => {
	const { stylesMap } = useTransitionStyles();

	const associatedStyles = useAnimatedStyle(() => {
		"worklet";

		if (!id || !stylesMap) {
			return EMPTY_STYLE;
		}

		return stylesMap.value[id] || EMPTY_STYLE;
	});

	return { associatedStyles };
};
