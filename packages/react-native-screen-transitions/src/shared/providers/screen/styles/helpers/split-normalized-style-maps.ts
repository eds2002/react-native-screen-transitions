import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../types/animation.types";

const LAYER_STYLE_SLOT_IDS = {
	content: true,
	backdrop: true,
	surface: true,
	[NAVIGATION_MASK_ELEMENT_STYLE_ID]: true,
	[NAVIGATION_MASK_CONTAINER_STYLE_ID]: true,
} as const;

const isLayerStyleSlotId = (slotId: string) => {
	"worklet";
	// biome-ignore lint/suspicious/noPrototypeBuiltins: <Typescript lib target is ES2020>
	return Object.prototype.hasOwnProperty.call(LAYER_STYLE_SLOT_IDS, slotId);
};

export const splitNormalizedStyleMaps = (
	stylesMap: NormalizedTransitionInterpolatedStyle,
): {
	layerStylesMap: NormalizedTransitionInterpolatedStyle;
	elementStylesMap: NormalizedTransitionInterpolatedStyle;
} => {
	"worklet";
	const layerStylesMap: NormalizedTransitionInterpolatedStyle = {};
	const elementStylesMap: NormalizedTransitionInterpolatedStyle = {};

	for (const slotId in stylesMap) {
		if (isLayerStyleSlotId(slotId)) {
			layerStylesMap[slotId] = stylesMap[slotId];
			continue;
		}

		elementStylesMap[slotId] = stylesMap[slotId];
	}

	return {
		layerStylesMap,
		elementStylesMap,
	};
};
