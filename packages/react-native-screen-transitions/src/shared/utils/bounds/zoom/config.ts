import type { BoundsOptions } from "../types/options";

export const ZOOM_SHARED_OPTIONS = Object.freeze({
	anchor: "top" as const,
	scaleMode: "uniform" as const,
});

export const ZOOM_DRAG_RESISTANCE = 0.4;
export const ZOOM_DRAG_DIRECTIONAL_SCALE_MIN = 0.25;
export const ZOOM_DRAG_DIRECTIONAL_SCALE_MAX = 1.06;
export const ZOOM_DRAG_DIRECTIONAL_SCALE_EXPONENT = 2;
export const ZOOM_BACKGROUND_SCALE = 0.9375;

export const ZOOM_MASK_OUTSET = Object.freeze({
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
});

export const getZoomAnchor = (
	target: BoundsOptions["target"] | undefined,
): BoundsOptions["anchor"] => {
	"worklet";
	return target === "bound" ? "center" : ZOOM_SHARED_OPTIONS.anchor;
};

export const toNumber = (value: unknown, fallback = 0): number => {
	"worklet";
	return typeof value === "number" ? value : fallback;
};
