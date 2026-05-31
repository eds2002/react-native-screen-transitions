import {
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../types/animation.types";
import { useScreenAnimationContext } from "../../animation";
import {
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
	const { screenInterpolatorProps, screenInterpolatorPropsRevision } =
		useScreenAnimationContext();
	const previousStyleStatesBySlot = useSharedValue<ResettableStyleStatesBySlot>(
		{},
	);
	const previousResolvedStylesMap =
		useSharedValue<NormalizedTransitionInterpolatedStyle>(NO_STYLES);

	return useDerivedValue(() => {
		"worklet";
		screenInterpolatorPropsRevision.get();

		const props = screenInterpolatorProps.get();
		// Keep missing local slots alive only when another route drives this screen
		// and no active local style layer is available. Once a current/next layer
		// runs, omitted local slots and dropped keys are intentional reset signals.
		const deferLocalSlotResets = !props.focused && !props.current.closing;

		const { resolvedStylesMap, nextPreviousStyleStatesBySlot } =
			resolveSlotStyles({
				localStylesMaps: localStylesMaps.get(),
				ancestorStylesMap: ancestorStylesMap?.get() ?? NO_STYLES,
				previousStyleStatesBySlot: previousStyleStatesBySlot.get(),
				deferLocalSlotResets,
			});

		previousStyleStatesBySlot.set(nextPreviousStyleStatesBySlot);
		const stableResolvedStylesMap = reuseEqualResolvedSlots({
			resolvedStylesMap,
			previousResolvedStylesMap: previousResolvedStylesMap.get(),
		});
		previousResolvedStylesMap.set(stableResolvedStylesMap);

		return stableResolvedStylesMap;
	});
};
