import {
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../types/animation.types";
import { useScreenAnimationContext } from "../../animation";
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
	const { screenInterpolatorProps, screenInterpolatorPropsRevision } =
		useScreenAnimationContext();
	const previousStyleStatesBySlot = useSharedValue<ResettableStyleStatesBySlot>(
		{},
	);

	return useDerivedValue(() => {
		"worklet";
		screenInterpolatorPropsRevision.get();

		const props = screenInterpolatorProps.get();
		// Keep missing local slots alive while another route drives this screen.
		// Custom ids and keys from slots that still exist are still reset.
		const deferLocalSlotResets = !props.focused && !props.current.closing;

		const { resolvedStylesMap, nextPreviousStyleStatesBySlot } =
			resolveSlotStyles({
				currentStylesMap: currentStylesMap.get(),
				ancestorStylesMap: ancestorStylesMap?.get() ?? NO_STYLES,
				previousStyleStatesBySlot: previousStyleStatesBySlot.get(),
				deferLocalSlotResets,
			});

		previousStyleStatesBySlot.set(nextPreviousStyleStatesBySlot);

		return resolvedStylesMap;
	});
};
