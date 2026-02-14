import {
	type StyleProps,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../constants";
import { useScreenStyles } from "../../providers/screen/styles.provider";

type Props = {
	id?: string;
	style?: StyleProps;
	resetTransformOnUnset?: boolean;
};

/**
 * This hook is used to get the associated styles for a given styleId / boundTag.
 */
export const useAssociatedStyles = ({
	id,
	resetTransformOnUnset = false,
}: Props = {}) => {
	const { stylesMap, ancestorStylesMaps } = useScreenStyles();
	const showAfterFirstFrame = useSharedValue(false);
	const previousAppliedKeys = useSharedValue<Record<string, true>>({});

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

		const currentKeys: Record<string, true> = {};
		for (const key in base) {
			currentKeys[key] = true;
		}

		const unsetPatch: Record<string, any> = {};
		for (const key in previousAppliedKeys.value) {
			if (!currentKeys[key]) {
				if (key === "transform" && resetTransformOnUnset) {
					unsetPatch.transform = [
						{ translateX: 0 },
						{ translateY: 0 },
						{ scaleX: 1 },
						{ scaleY: 1 },
					] as any;
				} else {
					unsetPatch[key] = undefined;
				}
			}
		}

		previousAppliedKeys.value = currentKeys;

		const mergedBase = { ...unsetPatch, ...base };

		let opacity = 1;

		if ("opacity" in mergedBase) {
			opacity = mergedBase.opacity as number;
		}

		if (!showAfterFirstFrame.value) {
			return { ...mergedBase, opacity: 0 };
		}

		if ("opacity" in mergedBase) {
			return mergedBase;
		}

		return { ...mergedBase, opacity };
	});

	return { associatedStyles };
};
