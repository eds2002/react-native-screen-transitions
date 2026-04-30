import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { Platform } from "react-native";
import type { MeasuredDimensions } from "react-native-reanimated";
import type {
	ScreenTransitionOptions,
	ScreenTransitionState,
} from "./types/animation.types";
import type { ActivationArea } from "./types/gesture.types";
import type { Layout, SheetScrollGestureBehavior } from "./types/screen.types";
import type { BaseStackRoute } from "./types/stack.types";

/**
 * Masked view integration
 * @deprecated No longer in use. Use {@link NAVIGATION_MASK_ELEMENT_STYLE_ID} and {@link NAVIGATION_MASK_CONTAINER_STYLE_ID} instead.
 */
export const MASK_STYLE_ID = "_ROOT_MASKED";
export const CONTAINER_STYLE_ID = "_ROOT_CONTAINER";

/**
 * Navigation mask integration
 */
export const NAVIGATION_MASK_ELEMENT_STYLE_ID =
	"NAVIGATION_MASK_ELEMENT_STYLE_ID";
export const NAVIGATION_MASK_CONTAINER_STYLE_ID =
	"NAVIGATION_MASK_CONTAINER_STYLE_ID";

/**
 * Styles
 */
export const NO_STYLES = Object.freeze({});
export const VISIBLE_STYLE = Object.freeze({ opacity: 1 });
export const NO_PROPS = Object.freeze({});

/**
 * Default gesture values
 */
const DEFAULT_RAW_GESTURE_VALUES = {
	x: 0,
	y: 0,
	normX: 0,
	normY: 0,
	scale: 1,
	normScale: 0,
} as const;

const DEFAULT_GESTURE_VALUES = {
	...DEFAULT_RAW_GESTURE_VALUES,
	focalX: 0,
	focalY: 0,
	raw: DEFAULT_RAW_GESTURE_VALUES,
	dismissing: 0,
	dragging: 0,
	direction: null,

	// Deprecated aliases
	normalizedX: 0,
	normalizedY: 0,
	isDismissing: 0,
	isDragging: 0,
} as const;

const createDefaultGestureValues = () => ({
	...DEFAULT_GESTURE_VALUES,
	raw: { ...DEFAULT_RAW_GESTURE_VALUES },
});

export const DEFAULT_SCREEN_TRANSITION_OPTIONS: ScreenTransitionOptions =
	Object.freeze({});

/**
 * Creates a new screen transition state object
 */
export const createScreenTransitionState = (
	route: BaseStackRoute,
	meta?: Record<string, unknown>,
	navigationMaskEnabled = false,
	options: ScreenTransitionOptions = DEFAULT_SCREEN_TRANSITION_OPTIONS,
): ScreenTransitionState => ({
	progress: 0,
	closing: 0,
	animating: 0,
	willAnimate: 0,
	settled: 1,
	logicallySettled: 1,
	entering: 0,
	gesture: createDefaultGestureValues(),
	route,
	meta,
	options,
	layouts: {
		screen: {
			width: 0,
			height: 0,
		},
		navigationMaskEnabled,
	},
	animatedSnapIndex: -1,
	snapIndex: -1,
});

/**
 * Default screen transition state
 */
export const DEFAULT_SCREEN_TRANSITION_STATE: ScreenTransitionState =
	Object.freeze({
		progress: 0,
		closing: 0,
		animating: 0,
		willAnimate: 0,
		settled: 1,
		logicallySettled: 1,
		entering: 0,
		gesture: createDefaultGestureValues(),
		route: {} as RouteProp<ParamListBase>,
		options: DEFAULT_SCREEN_TRANSITION_OPTIONS,
		layouts: {
			screen: {
				width: 0,
				height: 0,
			},
			navigationMaskEnabled: false,
		},
		animatedSnapIndex: -1,
		snapIndex: -1,
	});

/**
 * Bounds API Defaults
 */
export const TRANSFORM_RESET = Object.freeze({
	transform: [
		{ translateX: 0 },
		{ translateY: 0 },
		{ scale: 1 },
		{ scaleX: 1 },
		{ scaleY: 1 },
	],
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

export const DEFAULT_GESTURE_VELOCITY_IMPACT = 0.3;
export const DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT = 0.1;
export const DEFAULT_GESTURE_RELEASE_VELOCITY_MAX = 3.2;
export const DEFAULT_GESTURE_SENSITIVITY = 1;
export const DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE = 1;
export const DEFAULT_GESTURE_DIRECTION = "horizontal";
export const DEFAULT_GESTURE_DRIVES_PROGRESS = true;
export const DEFAULT_GESTURE_SNAP_LOCKED = false;
export const DEFAULT_GESTURE_ACTIVATION_AREA: ActivationArea = "screen";
export const DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR: SheetScrollGestureBehavior =
	"expand-and-collapse";

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
