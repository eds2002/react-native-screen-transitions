import { Platform } from "react-native";

export const REVEAL_BORDER_RADIUS = Platform.select({
	ios: 58,
	android: 36,
	default: 36,
});
export const REVEAL_SHADOW_COLOR = "rgba(0, 0, 0, 0.34)";
export const REVEAL_SHADOW_RADIUS = 34;
export const REVEAL_SHADOW_OFFSET_Y = 18;

export const ZOOM_SHARED_OPTIONS = Object.freeze({
	anchor: "top" as const,
	scaleMode: "uniform" as const,
});

export const ZOOM_DRAG_DIRECTIONAL_SCALE_MIN = 0.25;
export const ZOOM_DRAG_DIRECTIONAL_SCALE_MAX = 1.06;
export const ZOOM_DRAG_DIRECTIONAL_SCALE_EXPONENT = 2;
export const ZOOM_DRAG_TRANSLATION_NEGATIVE_MAX = 1;
export const ZOOM_DRAG_TRANSLATION_POSITIVE_MAX = 1;
export const ZOOM_DRAG_TRANSLATION_EXPONENT = 1;
export const ZOOM_FOCUSED_ELEMENT_OPEN_OPACITY_RANGE = [0, 1, 1, 1] as const;
export const ZOOM_FOCUSED_ELEMENT_CLOSE_OPACITY_RANGE = [0, 1, 1, 1] as const;
export const ZOOM_UNFOCUSED_ELEMENT_OPEN_OPACITY_RANGE = [1, 2, 1, 1] as const;
export const ZOOM_UNFOCUSED_ELEMENT_CLOSE_OPACITY_RANGE = [1, 2, 1, 1] as const;

export const ZOOM_MASK_OUTSET = Object.freeze({
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
});

export const toNumber = (value: unknown, fallback = 0): number => {
	"worklet";
	return typeof value === "number" ? value : fallback;
};
