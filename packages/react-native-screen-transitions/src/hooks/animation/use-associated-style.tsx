import {
	type StyleProps,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useTransitionStyles } from "../../providers/transition-styles";

type Props = {
	id?: string;
	style?: StyleProps;
};

const EMPTY_STYLE = Object.freeze({});

/**
 * This hook is used to get the associated styles for a given styleId / boundTag.
 */
export const useAssociatedStyles = ({ id }: Props = {}) => {
	const { stylesMap } = useTransitionStyles();
	const showAfterFirstFrame = useSharedValue(false);

	useDerivedValue(() => {
		"worklet";

		// If the associated styles have already been shown, return.

		if (!id) {
			showAfterFirstFrame.value = true;
			return;
		}

		if (!showAfterFirstFrame.value) {
			requestAnimationFrame(() => {
				showAfterFirstFrame.value = true;
			});
		}
	});

	const associatedStyles = useAnimatedStyle(() => {
		"worklet";

		if (!id || !stylesMap) {
			return EMPTY_STYLE;
		}
		const base = stylesMap.value[id] || EMPTY_STYLE;

		let opacity = 1;

		if ("opacity" in base) {
			opacity = base.opacity as number;
		}

		// Only force opacity to 0 during the initial frame; once ready,
		// return base unchanged so we never override user-provided opacity.
		if (!showAfterFirstFrame.value) {
			return { ...base, opacity: 0 };
		}

		// Since opacity exists on the base style, we don't need to override it.
		if ("opacity" in base) {
			return base;
		}

		return { ...base, opacity };
	});

	return { associatedStyles };
};
