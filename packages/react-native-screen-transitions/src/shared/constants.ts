import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { Platform } from "react-native";
import type { MeasuredDimensions } from "react-native-reanimated";
import type { ScreenTransitionState } from "./types/animation.types";
import type { ActivationArea } from "./types/gesture.types";
import type { Layout } from "./types/screen.types";
import type { BaseStackRoute } from "./types/stack.types";

/**
 * Masked view integration
 */
export const MASK_STYLE_ID = "_ROOT_MASKED";
export const CONTAINER_STYLE_ID = "_ROOT_CONTAINER";
export const NAVIGATION_MASK_HOST_FLAG_STYLE_ID = "_NAVIGATION_MASK_HOST";
export const NAVIGATION_MASK_STYLE_ID = "_NAVIGATION_ROOT_MASK";
export const NAVIGATION_CONTAINER_STYLE_ID = "_NAVIGATION_ROOT_CONTAINER";

/**
 * Styles
 */
export const NO_STYLES = Object.freeze({});

/**
 * Default gesture values
 */
const DEFAULT_GESTURE_VALUES = {
	x: 0,
	y: 0,
	normalizedX: 0,
	normalizedY: 0,
	isDismissing: 0,
	isDragging: 0,
	direction: null,
} as const;

/**
 * Creates a new screen transition state object
 */
export const createScreenTransitionState = (
	route: BaseStackRoute,
	meta?: Record<string, unknown>,
): ScreenTransitionState => ({
	progress: 0,
	closing: 0,
	animating: 0,
	entering: 1,
	gesture: { ...DEFAULT_GESTURE_VALUES },
	route,
	meta,
});

/**
 * Default screen transition state
 */
export const DEFAULT_SCREEN_TRANSITION_STATE: ScreenTransitionState =
	Object.freeze({
		progress: 0,
		closing: 0,
		animating: 0,
		entering: 1,
		gesture: DEFAULT_GESTURE_VALUES,
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
export const SNAP_VELOCITY_IMPACT = 0.1;
export const DEFAULT_GESTURE_DIRECTION = "horizontal";
export const DEFAULT_GESTURE_DRIVES_PROGRESS = true;
export const DEFAULT_GESTURE_ACTIVATION_AREA: ActivationArea = "screen";

export const IS_WEB = Platform.OS === "web";

export const TRUE = 1;
export const FALSE = 0;

/**
 * Small value for floating-point comparisons to handle animation/interpolation imprecision
 */
export const EPSILON = 1e-5;

/**
 * Threshold for snapping animations to target when "close enough" (1% of range).
 * Prevents micro-jitter/oscillation near animation endpoints.
 */
export const ANIMATION_SNAP_THRESHOLD = 0.01;
