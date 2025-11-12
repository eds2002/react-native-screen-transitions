import type { ParamListBase, RouteProp } from "@react-navigation/native";
import type { MeasuredDimensions } from "react-native-reanimated";
import type { ScreenTransitionState } from "./types/animation";
import type { BoundEntry } from "./types/bounds";
import type { Layout } from "./types/core";
import type { ActivationArea } from "./types/gesture";
import type { Complete } from "./types/utils";
import type { BoundsBuilderOptions } from "./utils/bounds/_types/builder";

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
		bounds: {} as Record<string, BoundEntry>,
		route: {} as RouteProp<ParamListBase>,
	});

/**
 * Bounds API Defaults
 */
export const NO_BOUNDS_MAP: Record<string, BoundEntry> = Object.freeze({});
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

export const DEFAULT_BUILDER_OPTIONS: Complete<
	Omit<BoundsBuilderOptions, "id">
> = Object.freeze({
	gestures: { x: 0, y: 0 },
	toFullscreen: false,
	absolute: false,
	relative: true,
	method: "transform",
	contentScaleMode: "auto",
	//
	space: "relative",
	target: "bound",
	scaleMode: "match",
	anchor: "center",
	raw: false,
} as const);

/**
 * Default gesture config
 */
export const GESTURE_VELOCITY_IMPACT = 0.3;
export const DEFAULT_GESTURE_DIRECTION = "horizontal";
export const DEFAULT_GESTURE_ENABLED = false;
export const DEFAULT_GESTURE_DRIVES_PROGRESS = true;
export const DEFAULT_GESTURE_ACTIVATION_AREA: ActivationArea = "screen";

/**
 * Default gesture offset
 */
export const GESTURE_ACTIVATION_THRESHOLD_X = 10;
export const GESTURE_ACTIVATION_THRESHOLD_Y = 10;
export const GESTURE_FAIL_TOLERANCE_X = 15;
export const GESTURE_FAIL_TOLERANCE_Y = 20;
export const DEFAULT_EDGE_DISTANCE_HORIZONTAL = 50;
export const DEFAULT_EDGE_DISTANCE_VERTICAL = 135;
export const DEFAULT_ACTIVATION_AREA = "screen" as const;
