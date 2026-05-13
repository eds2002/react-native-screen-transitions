import { Platform } from "react-native";

export const REVEAL_BORDER_RADIUS = Platform.select({
	ios: 58,
	android: 36,
	default: 36,
});

export const DRAG_DIRECTIONAL_SCALE_MIN = 0.25;
export const DRAG_DIRECTIONAL_SCALE_MAX = 1.06;
export const DRAG_DIRECTIONAL_SCALE_EXPONENT = 2;
export const DRAG_MASK_HEIGHT_COLLAPSE_END = 0.7;
export const DISMISS_SCALE_ORBIT_DEPTH = 0.8;
