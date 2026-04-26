import {
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../types/animation.types";
import {
	type ResettableStyleStatesBySlot,
	resolveSlotStyles,
} from "../helpers/resolve-slot-styles";

interface UseResolvedStylesMapParams {
	currentStylesMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	ancestorStylesMap?: SharedValue<NormalizedTransitionInterpolatedStyle>;
}

export const useResolvedStylesMap = ({
	currentStylesMap,
	ancestorStylesMap,
}: UseResolvedStylesMapParams) => {
	const previousStyleStatesBySlot = useSharedValue<ResettableStyleStatesBySlot>(
		{},
	);

	return useDerivedValue(() => {
		"worklet";

		const { resolvedStylesMap, nextPreviousStyleStatesBySlot } =
			resolveSlotStyles({
				currentStylesMap: currentStylesMap.get(),
				ancestorStylesMap: ancestorStylesMap?.get() ?? NO_STYLES,
				previousStyleStatesBySlot: previousStyleStatesBySlot.get(),
			});

		previousStyleStatesBySlot.set(nextPreviousStyleStatesBySlot);

		return resolvedStylesMap;
	});
};
