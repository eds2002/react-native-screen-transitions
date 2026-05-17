import { Platform } from "react-native";

export const REVEAL_BORDER_RADIUS = Platform.select({
	ios: 58,
	android: 36,
	default: 36,
});

export const REVEAL_USES_TRANSFORM_MASK = Platform.OS === "android";

export const DRAG_DIRECTIONAL_SCALE_MIN = 0.25;
export const DRAG_DIRECTIONAL_SCALE_MAX = 1.06;
export const DRAG_DIRECTIONAL_SCALE_EXPONENT = 2;
export const DRAG_MASK_HEIGHT_COLLAPSE_END = 0.7;
export const HORIZONTAL_DRAG_MASK_COLLAPSE_SCALE = 0.5;
export const DISMISS_SCALE_ORBIT_DEPTH = 0.5;
export const CLOSE_SOURCE_HANDOFF_PROGRESS = 0.25;

export const IDENTITY_DRAG_SCALE_OUTPUT = [1, 1] as const;
export const ZERO_TO_ONE_RANGE = [0, 1] as const;
export const CONTENT_ENTERING_OPACITY_RANGE = [
	0,
	CLOSE_SOURCE_HANDOFF_PROGRESS,
] as const;
export const CONTENT_CLOSING_OPACITY_RANGE = [
	0,
	CLOSE_SOURCE_HANDOFF_PROGRESS,
	1,
] as const;
export const CONTENT_ENTERING_OPACITY_OUTPUT = [0, 1] as const;
export const CONTENT_CLOSING_OPACITY_OUTPUT = [0, 1, 1] as const;
export const CONTENT_SHADOW_OPACITY_OUTPUT = [0, 0.25] as const;
export const UNFOCUSED_ELEMENT_OPACITY_OUTPUT = [1, 0] as const;
export const REVEAL_SHADOW_OFFSET = { width: 0, height: 2 } as const;
