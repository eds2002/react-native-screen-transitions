export const ZOOM_SHARED_OPTIONS = Object.freeze({
	anchor: "top" as const,
	scaleMode: "uniform" as const,
});

export const ZOOM_DISMISS_VELOCITY_DEPTH = 1.0;
export const ZOOM_BACKGROUND_SCALE = 0.9375;
// Keep the previous screen visible beneath the zoom instead of reaching black.
export const ZOOM_BACKDROP_MAX_OPACITY = 0.45;
// Geometry-aligned native frames reach their darkest point around here.
export const ZOOM_SCREEN_A_FADE_END = 0.54;
// Open uses a tight owner handoff after red has traveled about one quarter.
export const ZOOM_FOCUSED_ELEMENT_OPEN_OPACITY_RANGE = [0, 0.4, 0, 1] as const;
export const ZOOM_UNFOCUSED_ELEMENT_OPEN_OPACITY_RANGE = [
	1.27, 1.4, 1, 0,
] as const;
// On close, red is prepared behind opaque blue before blue fades away.
export const ZOOM_FOCUSED_ELEMENT_CLOSE_OPACITY_RANGE = [
	0.13, 0.7, 0, 1,
] as const;
export const ZOOM_UNFOCUSED_ELEMENT_CLOSE_OPACITY_RANGE = [
	1.7, 2, 1, 0,
] as const;
