import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { Platform } from "react-native";
import type { MeasuredDimensions } from "react-native-reanimated";
import type { ScreenTransitionState } from "./types/animation.types";
import type { ActivationArea } from "./types/gesture.types";
import type { Layout } from "./types/screen.types";

/**
 * Masked view integration
 */
export const MASK_STYLE_ID = "_ROOT_MASKED";
export const CONTAINER_STYLE_ID = "_ROOT_CONTAINER";

/**
 * Styles
 */
export const NO_STYLES = Object.freeze({});

/**
 * Default screen transition state
 */
export const DEFAULT_SCREEN_TRANSITION_STATE: ScreenTransitionState =
	Object.freeze({
		progress: 0,
		closing: 0,
		animating: 0,
		gesture: {
			x: 0,
			y: 0,
			normalizedX: 0,
			normalizedY: 0,
			isDismissing: 0,
			isDragging: 0,
			direction: null,
		},
		route: {} as RouteProp<ParamListBase>,
	});

/**
 * Bounds API Defaults
 */
export const EMPTY_BOUND_HELPER_RESULT = Object.freeze({});
export const EMPTY_BOUND_HELPER_RESULT_RAW = Object.freeze({
	scaleX: 1,
	scaleY: 1,
	scale: 1,
	translateX: 0,
	translateY: 0,
	width: 0,
	height: 0,
});
export const ENTER_RANGE = [0, 1] as const;
export const EXIT_RANGE = [1, 2] as const;

export const FULLSCREEN_DIMENSIONS = (
	dimensions: Layout,
): MeasuredDimensions => {
	"worklet";
	return {
		x: 0,
		y: 0,
		pageX: 0,
		pageY: 0,
		width: dimensions.width,
		height: dimensions.height,
	};
};

/**
 * Default gesture config
 */
export const GESTURE_VELOCITY_IMPACT = 0.3;
export const DEFAULT_GESTURE_DIRECTION = "horizontal";
export const DEFAULT_GESTURE_DRIVES_PROGRESS = true;
export const DEFAULT_GESTURE_ACTIVATION_AREA: ActivationArea = "screen";

export const IS_WEB = Platform.OS === "web";

export const TRUE = 1;
export const FALSE = 0;
