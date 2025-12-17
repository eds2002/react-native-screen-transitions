import {
	type StyleProps,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../constants";
import { useTransitionStyles } from "../../providers/screen/styles.provider";

type Props = {
	id?: string;
	style?: StyleProps;
};

/**
 * This hook is used to get the associated styles for a given styleId / boundTag.
 */
export const useAssociatedStyles = ({ id }: Props = {}) => {
	const { stylesMap, ancestorStylesMaps } = useTransitionStyles();
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

		if (!id) {
			return NO_STYLES;
		}

		// Check local styles first, then fall back to parent
		const ownStyle = stylesMap.value[id];

		const ancestorStyle = ancestorStylesMaps.find(
			(ancestorMap) => ancestorMap.value[id],
		)?.value[id];

		const base = ownStyle || ancestorStyle || NO_STYLES;

		let opacity = 1;

		if ("opacity" in base) {
			opacity = base.opacity as number;
		}

		if (!showAfterFirstFrame.value) {
			return { ...base, opacity: 0 };
		}

		if ("opacity" in base) {
			return base;
		}

		return { ...base, opacity };
	});

	return { associatedStyles };
};
