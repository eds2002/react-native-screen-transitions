import {
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../types/animation.types";
import {
	buildResolvedStyleMap,
	type ResettableStyleKeySet,
} from "../helpers/build-resolved-style-map";

interface UseResolvedSlotStyleMapParams {
	currentStylesMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	fallbackStylesMap?: SharedValue<NormalizedTransitionInterpolatedStyle>;
}

export const useResolvedSlotStyleMap = ({
	currentStylesMap,
	fallbackStylesMap,
}: UseResolvedSlotStyleMapParams) => {
	const previousStyleKeysBySlot = useSharedValue<
		Record<string, ResettableStyleKeySet>
	>({});

	return useDerivedValue(() => {
		"worklet";

		const { resolvedStylesMap, nextPreviousStyleKeysBySlot } =
			buildResolvedStyleMap({
				currentStylesMap: currentStylesMap.get(),
				fallbackStylesMap: fallbackStylesMap?.get() ?? NO_STYLES,
				previousStyleKeysBySlot: previousStyleKeysBySlot.get(),
			});

		previousStyleKeysBySlot.set(nextPreviousStyleKeysBySlot);

		return resolvedStylesMap;
	});
};
