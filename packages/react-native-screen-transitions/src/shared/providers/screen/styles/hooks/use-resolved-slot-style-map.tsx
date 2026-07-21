import {
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_PROPS, NO_STYLES } from "../../../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../types/animation.types";
import {
	areResettableStatesBySlotEqual,
	type LocalStyleLayers,
	type ResettableStyleStatesBySlot,
	resolveSlotStyles,
	reuseEqualResolvedSlots,
} from "../helpers/resolve-slot-styles";

interface UseResolvedStylesMapParams {
	localStylesMaps: SharedValue<LocalStyleLayers>;
	ancestorStylesMap?: SharedValue<NormalizedTransitionInterpolatedStyle>;
}

export const useResolvedStylesMap = ({
	localStylesMaps,
	ancestorStylesMap,
}: UseResolvedStylesMapParams) => {
	const previousStyleStatesBySlot =
		useSharedValue<ResettableStyleStatesBySlot>(NO_PROPS);
	const previousResolvedStylesMap =
		useSharedValue<NormalizedTransitionInterpolatedStyle>(NO_STYLES);

	return useDerivedValue<NormalizedTransitionInterpolatedStyle>(() => {
		"worklet";
		const { resolvedStylesMap, nextPreviousStyleStatesBySlot } =
			resolveSlotStyles({
				localStylesMaps: localStylesMaps.get(),
				ancestorStylesMap: ancestorStylesMap?.get() ?? NO_STYLES,
				previousStyleStatesBySlot: previousStyleStatesBySlot.get(),
			});

		if (
			!areResettableStatesBySlotEqual(
				previousStyleStatesBySlot.get(),
				nextPreviousStyleStatesBySlot,
			)
		) {
			previousStyleStatesBySlot.set(nextPreviousStyleStatesBySlot);
		}

		const previousResolvedStyles = previousResolvedStylesMap.get();
		const stableResolvedStylesMap = reuseEqualResolvedSlots({
			resolvedStylesMap,
			previousResolvedStylesMap: previousResolvedStyles,
		});

		if (stableResolvedStylesMap !== previousResolvedStyles) {
			previousResolvedStylesMap.set(stableResolvedStylesMap);
		}

		return stableResolvedStylesMap;
	});
};
