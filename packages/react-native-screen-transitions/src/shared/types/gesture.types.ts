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
	snapAxisInverted?: boolean;
};

export type RawGestureValues = {
	/**
	 * The horizontal translation before gesture sensitivity is applied.
	 */
	x: number;
	/**
	 * The vertical translation before gesture sensitivity is applied.
	 */
	y: number;
	/**
	 * The normalized horizontal translation before gesture sensitivity is applied.
	 */
	normX: number;
	/**
	 * The normalized vertical translation before gesture sensitivity is applied.
	 */
	normY: number;
	/**
	 * The pinch scale before gesture sensitivity is applied. Idle is 1.
	 */
	scale: number;
	/**
	 * The normalized pinch scale delta before gesture sensitivity is applied.
	 */
	normScale: number;
};

export type GestureValues = {
	/**
	 * The live horizontal translation of the gesture after gesture sensitivity is
	 * applied.
	 */
	x: number;
	/**
	 * The live vertical translation of the gesture after gesture sensitivity is
	 * applied.
	 */
	y: number;
	/**
	 * The live normalized horizontal translation of the gesture after gesture
	 * sensitivity is applied (-1 to 1).
	 */
	normX: number;
	/**
	 * The live normalized vertical translation of the gesture after gesture
	 * sensitivity is applied (-1 to 1).
	 */
	normY: number;
	/**
	 * The live pinch scale after gesture sensitivity is applied. Idle is 1.
	 */
	scale: number;
	/**
	 * The live normalized pinch scale delta after gesture sensitivity is applied
	 * (-1 to 1).
	 * Negative values represent pinch-in, positive values represent pinch-out.
	 */
	normScale: number;
	/**
	 * The live pinch focal point x-position.
	 */
	focalX: number;
	/**
	 * The live pinch focal point y-position.
	 */
	focalY: number;
	/**
	 * Pre-sensitivity gesture values. Use these when deriving dynamic gesture
	 * config from the physical gesture input.
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
