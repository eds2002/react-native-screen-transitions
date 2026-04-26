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

export type SnapPanAxis = "horizontal" | "vertical";

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
	/**
	 * The physical horizontal pan translation in pixels before `gestureSensitivity`
	 * is applied. Positive values represent movement to the right, negative
	 * values represent movement to the left, and idle is `0`.
	 */
	x: number;
	/**
	 * The physical vertical pan translation in pixels before `gestureSensitivity`
	 * is applied. Positive values represent movement down, negative values
	 * represent movement up, and idle is `0`.
	 */
	y: number;
	/**
	 * The physical horizontal pan translation normalized by screen width before
	 * `gestureSensitivity` is applied. Values are clamped to `-1...1`; idle is
	 * `0`.
	 */
	normX: number;
	/**
	 * The physical vertical pan translation normalized by screen height before
	 * `gestureSensitivity` is applied. Values are clamped to `-1...1`; idle is
	 * `0`.
	 */
	normY: number;
	/**
	 * The physical pinch scale before `gestureSensitivity` is applied. Idle is
	 * `1`, values below `1` represent pinch-in, and values above `1` represent
	 * pinch-out.
	 */
	scale: number;
	/**
	 * The physical pinch scale delta before `gestureSensitivity` is applied.
	 * Values are clamped to `-1...1`; idle is `0`, negative values represent
	 * pinch-in, and positive values represent pinch-out.
	 */
	normScale: number;
};

export type GestureValues = {
	/**
	 * The live horizontal pan translation in pixels after `gestureSensitivity` is
	 * applied. Positive values represent movement to the right, negative values
	 * represent movement to the left, and idle is `0`.
	 *
	 * Use `raw.x` when you need the physical translation before sensitivity.
	 */
	x: number;
	/**
	 * The live vertical pan translation in pixels after `gestureSensitivity` is
	 * applied. Positive values represent movement down, negative values represent
	 * movement up, and idle is `0`.
	 *
	 * Use `raw.y` when you need the physical translation before sensitivity.
	 */
	y: number;
	/**
	 * The live horizontal pan translation normalized by screen width after
	 * `gestureSensitivity` is applied. Values are clamped to `-1...1`; idle is
	 * `0`.
	 *
	 * Use `raw.normX` when you need the physical normalized translation before
	 * sensitivity.
	 */
	normX: number;
	/**
	 * The live vertical pan translation normalized by screen height after
	 * `gestureSensitivity` is applied. Values are clamped to `-1...1`; idle is
	 * `0`.
	 *
	 * Use `raw.normY` when you need the physical normalized translation before
	 * sensitivity.
	 */
	normY: number;
	/**
	 * The live pinch scale after `gestureSensitivity` is applied. Idle is `1`,
	 * values below `1` represent pinch-in, and values above `1` represent
	 * pinch-out.
	 *
	 * Use `raw.scale` when you need the physical pinch scale before sensitivity.
	 */
	scale: number;
	/**
	 * The live normalized pinch scale delta after `gestureSensitivity` is applied.
	 * Values are clamped to `-1...1`; idle is `0`, negative values represent
	 * pinch-in, and positive values represent pinch-out.
	 *
	 * Use `raw.normScale` when you need the physical normalized pinch delta before
	 * sensitivity.
	 */
	normScale: number;
	/**
	 * The live pinch focal point x-position in screen coordinates. This value is
	 * not affected by `gestureSensitivity`.
	 */
	focalX: number;
	/**
	 * The live pinch focal point y-position in screen coordinates. This value is
	 * not affected by `gestureSensitivity`.
	 */
	focalY: number;
	/**
	 * Physical gesture values before `gestureSensitivity` is applied.
	 *
	 * Use these when deriving dynamic gesture config from gesture input, or when
	 * an animation needs the user's actual pan/pinch movement instead of the
	 * sensitivity-adjusted values exposed on the parent gesture object.
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
	 * The initial pan direction that activated the gesture.
	 */
	direction: ResolvedPanGestureDirection | null;
};
