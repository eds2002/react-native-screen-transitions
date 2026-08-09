import { useRoute } from "@react-navigation/native";
import { useMemo } from "react";
import { useAnimatedProps, useAnimatedStyle } from "react-native-reanimated";
import { NO_PROPS, NO_STYLES } from "../../../../constants";
import {
	composeSlotStyleWithLocalTransform,
	getLocalTransformForSlotComposition,
} from "../helpers/compose-slot-style";
import { useScreenSlots } from "../slot.provider";

const useCurrentScreenSlotsMap = () => {
	const route = useRoute();
	const slotsMap = useScreenSlots(route.key, (store) => store.slotsMap);

	if (!slotsMap) {
		throw new Error(`ScreenSlot store for route "${route.key}" was not found`);
	}

	return slotsMap;
};

export const useSlotStyles = (slotId: string | undefined) => {
	const slotsMap = useCurrentScreenSlotsMap();

	return useAnimatedStyle(() => {
		const slot = slotId ? slotsMap.get()[slotId] : undefined;
		const slotStyle = slot?.style ?? NO_STYLES;

		return composeSlotStyleWithLocalTransform(
			slotStyle,
			undefined,
			slot?.boundsLocalTransform,
		);
	});
};

export const useComposedSlotStyles = (
	slotId: string | undefined,
	style: unknown,
) => {
	const slotsMap = useCurrentScreenSlotsMap();
	const localTransform = useMemo(
		() => getLocalTransformForSlotComposition(style),
		[style],
	);

	return useAnimatedStyle(() => {
		const slot = slotId ? slotsMap.get()[slotId] : undefined;
		const slotStyle = slot?.style ?? NO_STYLES;

		return composeSlotStyleWithLocalTransform(
			slotStyle,
			localTransform,
			slot?.boundsLocalTransform,
		);
	});
};

/**
 * Stacking-only slice (`zIndex`/`elevation`) of a slot's style. Returned
 * separately so an owner can keep just its stacking context while a nested
 * target takes the full associated style. Yields `NO_STYLES` when neither is set.
 */
export const useSlotStackingStyles = (slotId: string | undefined) => {
	const slotsMap = useCurrentScreenSlotsMap();

	return useAnimatedStyle(() => {
		const baseStyle = slotId ? slotsMap.get()[slotId]?.style : undefined;
		const zIndex = baseStyle?.zIndex ?? 0;
		const elevation = baseStyle?.elevation ?? 0;

		if (zIndex === 0 && elevation === 0) {
			return NO_STYLES;
		}

		return { zIndex, elevation };
	});
};

export const useSlotLayoutStyles = (slotId: string | undefined) => {
	const slotsMap = useCurrentScreenSlotsMap();

	return useAnimatedStyle(() => {
		const baseStyle = slotId ? slotsMap.get()[slotId]?.style : undefined;
		const width = baseStyle?.width;
		const height = baseStyle?.height;
		const minWidth = baseStyle?.minWidth;
		const minHeight = baseStyle?.minHeight;
		const maxWidth = baseStyle?.maxWidth;
		const maxHeight = baseStyle?.maxHeight;
		const aspectRatio = baseStyle?.aspectRatio;

		if (
			width === undefined &&
			height === undefined &&
			minWidth === undefined &&
			minHeight === undefined &&
			maxWidth === undefined &&
			maxHeight === undefined &&
			aspectRatio === undefined
		) {
			return NO_STYLES;
		}

		return {
			width,
			height,
			minWidth,
			minHeight,
			maxWidth,
			maxHeight,
			aspectRatio,
		};
	});
};

export const useSlotProps = (slotId: string | undefined) => {
	const slotsMap = useCurrentScreenSlotsMap();

	return useAnimatedProps(() => {
		return (slotId ? slotsMap.get()[slotId]?.props : undefined) ?? NO_PROPS;
	});
};
