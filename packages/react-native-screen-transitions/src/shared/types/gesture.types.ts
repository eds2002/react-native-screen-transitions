export type PanGestureDirection =
	| "horizontal"
	| "horizontal-inverted"
	| "vertical"
	| "vertical-inverted"
	| "bidirectional";

export type ResolvedPanGestureDirection = Exclude<
	PanGestureDirection,
	"bidirectional"
>;

export type PinchGestureDirection = "pinch-in" | "pinch-out";

export type GestureDirection = PanGestureDirection | PinchGestureDirection;

export type ActiveGesture = ResolvedPanGestureDirection | PinchGestureDirection;

export type GestureProgressMode = "progress-driven" | "freeform";

export type SnapPanAxis = "horizontal" | "vertical";

export type ScrollGestureAxis = "vertical" | "horizontal";

export type ScrollGestureAxisState = {
	offset: number;
	contentSize: number;
	layoutSize: number;
};

export type ScrollGestureState = {
	vertical: ScrollGestureAxisState;
	horizontal: ScrollGestureAxisState;
	isTouched: boolean;
};

export type SnapPanAxisConfig = {
	collapse: ResolvedPanGestureDirection;
	expand: ResolvedPanGestureDirection;
	inverted: boolean;
	progressSign: -1 | 1;
};

export type SnapPanDirectionConfig = Record<
	SnapPanAxis,
	SnapPanAxisConfig | null
>;

export type SnapPinchDirectionConfig = {
	collapse: PinchGestureDirection;
	expand: PinchGestureDirection;
} | null;

export type ActivationArea = "edge" | "screen";

export type SideActivation = {
	left?: ActivationArea;
	right?: ActivationArea;
	top?: ActivationArea;
	bottom?: ActivationArea;
};

export enum GestureActivationState {
	PENDING,
	PASSED,
	FAILED,
}

export { GestureActivationState as GestureOffsetState };

export type GestureActivationArea = ActivationArea | SideActivation;

/**
 * Resolved boolean flags for which directions a gesture is active in.
 * Shared across gesture activation, velocity, and dismissal logic.
 */
export type GestureDirections = {
	horizontal: boolean;
	horizontalInverted: boolean;
	vertical: boolean;
	verticalInverted: boolean;
};

export type RawGestureValues = {
	x: number;
	y: number;
	normX: number;
	normY: number;
	scale: number;
	normScale: number;
};

export type GestureValues = {
	/**
	 * The live horizontal translation of the gesture.
	 */
	x: number;
	/**
	 * The live vertical translation of the gesture.
	 */
	y: number;
	/**
	 * The live normalized horizontal translation of the gesture (-1 to 1).
	 */
	normX: number;
	/**
	 * The live normalized vertical translation of the gesture (-1 to 1).
	 */
	normY: number;
	/**
	 * A 0-1 scalar derived from the pan velocity magnitude, normalized against
	 * a screen-relative full-flick threshold.
	 *
	 * This is live while dragging, frozen at release during dismiss animations,
	 * and reset to 0 while idle or settling from a cancelled gesture.
	 */
	velocity: number;
	/**
	 * The live pinch scale after `gestureSensitivity` is applied.
	 */
	scale: number;
	/**
	 * The live normalized pinch scale delta after `gestureSensitivity` is applied.
	 */
	normScale: number;
	/**
	 * The live pinch focal point x-position in screen coordinates.
	 */
	focalX: number;
	/**
	 * The live pinch focal point y-position in screen coordinates.
	 */
	focalY: number;
	/**
	 * Physical gesture values before `gestureSensitivity` is applied.
	 */
	raw: RawGestureValues;
	/**
	 * A flag indicating if the screen is in the process of dismissing (0 or 1).
	 */
	dismissing: number;
	/**
	 * A flag indicating if the user's finger is on the screen (0 or 1).
	 */
	dragging: number;
	/**
	 * A flag indicating if released gesture values are animating back to neutral.
	 */
	settling: number;
	/**
	 * The gesture that is currently active.
	 */
	active: ActiveGesture | null;
	/**
	 * The initial pan direction that activated the gesture.
	 *
	 * @deprecated Use `active` instead.
	 */
	direction: ResolvedPanGestureDirection | null;

	/** @deprecated Use `normX` instead. */
	normalizedX: number;
	/** @deprecated Use `normY` instead. */
	normalizedY: number;
	/** @deprecated Use `dismissing` instead. */
	isDismissing: number;
	/** @deprecated Use `dragging` instead. */
	isDragging: number;
};
