export type GestureDirection =
	| "horizontal"
	| "horizontal-inverted"
	| "vertical"
	| "vertical-inverted"
	| "bidirectional";

export type ActivationArea = "edge" | "screen";

export type SideActivation = {
	left?: ActivationArea;
	right?: ActivationArea;
	top?: ActivationArea;
	bottom?: ActivationArea;
};

export enum GestureOffsetState {
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

export type GestureValues = {
	/**
	 * A `SharedValue` indicating if the user's finger is on the screen (0 or 1).
	 */
	isDragging: number;
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
	normalizedX: number;
	/**
	 * The live normalized vertical translation of the gesture (-1 to 1).
	 */
	normalizedY: number;
	/**
	 * A flag indicating if the screen is in the process of dismissing.
	 */
	isDismissing: number;
	/**
	 * The initial direction that activated the gesture.
	 */
	direction: Omit<GestureDirection, "bidirectional"> | null;
};
