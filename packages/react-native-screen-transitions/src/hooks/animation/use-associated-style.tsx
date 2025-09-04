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
export const useAssociatedStyles = ({ id, style }: Props = {}) => {
	const { stylesMap } = useTransitionStyles();
	const showAfterFirstFrame = useSharedValue(false);

	useDerivedValue(() => {
		"worklet";
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
		const base =
			(stylesMap.value[id] as Record<string, unknown>) || EMPTY_STYLE;

		let opacity = 1;

		if ("opacity" in base) {
			opacity = base.opacity as number;
		}
		if (style && "opacity" in style) {
			opacity = style.opacity as number;
		}

		// Only force opacity to 0 during the initial frame; once ready,
		// return base unchanged so we never override user-provided opacity.
		if (!showAfterFirstFrame.value) {
			return { ...base, opacity: 0 } as Record<string, unknown>;
		}

		return { ...base, opacity };
	});

	return { associatedStyles };
};
