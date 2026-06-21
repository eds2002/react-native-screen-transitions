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

/**
 * Axis reported by a transition-aware scrollable.
 */
export type ScrollGestureAxis = "vertical" | "horizontal";

/**
 * Scroll geometry for one axis of a transition-aware scrollable.
 */
export type ScrollGestureAxisState = {
	offset: number;
	contentSize: number;
	layoutSize: number;
	isTouched: boolean;
};

/**
 * Scroll metadata exposed through screen transition layouts.
 */
export type ScrollMetadataState = {
	vertical: ScrollGestureAxisState | null;
	horizontal: ScrollGestureAxisState | null;
};

/**
 * Scroll geometry used by gesture coordination.
 */
export type ScrollGestureState = {
	vertical: ScrollGestureAxisState;
	horizontal: ScrollGestureAxisState;
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

export type GestureDirectionActivationArea = ActivationArea | number;

export type GestureDirectionConfig = {
	gesture: GestureDirection;
	/**
	 * Pan-only activation area for this gesture direction. Pinch directions
	 * ignore this field.
	 *
	 * A number means an edge distance in points.
	 */
	area?: GestureDirectionActivationArea;
};

export type GestureDirectionEntry = GestureDirection | GestureDirectionConfig;

export type GestureDirectionOption =
	| GestureDirectionEntry
	| GestureDirectionEntry[];

export enum GestureActivationState {
	PENDING,
	PASSED,
	FAILED,
}

export type ResolvedGestureActivationArea =
	| GestureDirectionActivationArea
	| {
			left?: GestureDirectionActivationArea;
			right?: GestureDirectionActivationArea;
			top?: GestureDirectionActivationArea;
			bottom?: GestureDirectionActivationArea;
	  };

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
	rotation: number;
};

/**
 * Gesture values used when a release hands off into a dismiss animation.
 *
 * These match live gesture values while a screen is not dismissing, then read
 * from the release snapshot while dismissal is in flight.
 */
export type GestureHandoffValues = {
	x: number;
	y: number;
	normX: number;
	normY: number;
	velocity: number;
	scale: number;
	normScale: number;
	focalX: number;
	focalY: number;
	rotation: number;
	raw: RawGestureValues;
	/**
	 * The gesture associated with the handoff values.
	 */
	active: ActiveGesture | null;
	/**
	 * The pan direction associated with the handoff values.
	 *
	 * @deprecated Use `active` instead.
	 */
	direction: ResolvedPanGestureDirection | null;
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
	 * The live two-finger rotation in radians.
	 */
	rotation: number;
	/**
	 * Physical gesture values before `gestureSensitivity` is applied.
	 */
	raw: RawGestureValues;
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
	/**
	 * Gesture values latched at the release boundary for animation handoff.
	 *
	 * While dragging, these values match the live gesture values. During a
	 * dismissing release, they read from the release snapshot so live gesture
	 * values can reset without breaking handoff animations.
	 */
	handoff: GestureHandoffValues;
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
	/** @deprecated Use `normX` instead. */
	normalizedX: number;
	/** @deprecated Use `normY` instead. */
	normalizedY: number;
	/** @deprecated Use `dismissing` instead. */
	isDismissing: number;
	/** @deprecated Use `dragging` instead. */
	isDragging: number;
};
