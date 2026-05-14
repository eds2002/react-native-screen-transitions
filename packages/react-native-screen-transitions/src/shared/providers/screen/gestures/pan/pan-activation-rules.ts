import type { GestureDirections } from "../../../../types/gesture.types";
import {
	type ActivationArea,
	type GestureActivationArea,
	GestureActivationState,
	type SideActivation,
} from "../../../../types/gesture.types";
import type { Direction } from "../../../../types/ownership.types";
import type { Layout } from "../../../../types/screen.types";
import type { ScrollGestureState } from "../types";

interface ResolveOffsetRulesProps {
	initialTouch: { x: number; y: number };
	touch: { x: number; y: number };
	directions: GestureDirections;
	activationState: GestureActivationState;
	activationArea?: GestureActivationArea;
	dimensions: Layout;
	responseDistance?: number;
}

type NormalizedSides = {
	left: ActivationArea;
	right: ActivationArea;
	top: ActivationArea;
	bottom: ActivationArea;
};

interface ShouldActivateOrFailProps {
	deltaX: number;
	deltaY: number;
	isHorizontalSwipe: boolean;
	isVerticalSwipe: boolean;
	allowedRight: boolean;
	allowedLeft: boolean;
	allowedUp: boolean;
	allowedDown: boolean;
	horizontalGateRight: boolean;
	horizontalGateLeft: boolean;
	verticalGateUp: boolean;
	verticalGateDown: boolean;
	isSwipingRight: boolean;
	isSwipingLeft: boolean;
	isSwipingUp: boolean;
	isSwipingDown: boolean;
}

interface ReturnValues {
	isSwipingDown: boolean;
	isSwipingUp: boolean;
	isSwipingRight: boolean;
	isSwipingLeft: boolean;
}

interface OffsetRuleResult extends ReturnValues {
	nextActivationState: GestureActivationState;
}

type ActivationResult = {
	shouldActivate: boolean;
	shouldFail: boolean;
};

interface AxisActivationProps {
	movement: number;
	deviation: number;
	movementThreshold: number;
	deviationTolerance: number;
	positiveSwipe: boolean;
	negativeSwipe: boolean;
	positiveAllowed: boolean;
	negativeAllowed: boolean;
	positiveGate: boolean;
	negativeGate: boolean;
}

type BoundaryState = {
	atStart: boolean;
	atEnd: boolean;
};

/**
 * 10 seems like the correct threshold for compatability with nested gestures outside of our package.
 */
const GESTURE_ACTIVATION_THRESHOLD_X = 10;
const GESTURE_ACTIVATION_THRESHOLD_Y = 10;
const GESTURE_FAIL_TOLERANCE_X = 15;
const GESTURE_FAIL_TOLERANCE_Y = 20;
const DEFAULT_EDGE_DISTANCE_HORIZONTAL = 50;
const DEFAULT_EDGE_DISTANCE_VERTICAL = 135;
const DEFAULT_ACTIVATION_AREA = "screen" as const;
const SCROLL_EPILSON = 1;

export function normalizeSides(area?: GestureActivationArea): NormalizedSides {
	"worklet";
	if (!area || typeof area === "string") {
		const mode: ActivationArea = area ?? DEFAULT_ACTIVATION_AREA;
		return { left: mode, right: mode, top: mode, bottom: mode };
	}

	const s: SideActivation = area as SideActivation;
	return {
		left: s.left ?? DEFAULT_ACTIVATION_AREA,
		right: s.right ?? DEFAULT_ACTIVATION_AREA,
		top: s.top ?? DEFAULT_ACTIVATION_AREA,
		bottom: s.bottom ?? DEFAULT_ACTIVATION_AREA,
	};
}

const canActivateFromStartEdge = (
	mode: ActivationArea,
	touchPosition: number,
	distance: number,
) => {
	"worklet";
	return mode === "screen" || touchPosition <= distance;
};

const canActivateFromEndEdge = (
	mode: ActivationArea,
	touchPosition: number,
	size: number,
	distance: number,
) => {
	"worklet";
	return mode === "screen" || touchPosition >= size - distance;
};

export function computeEdgeConstraints(
	initialTouch: { x: number; y: number },
	dimensions: Layout,
	sides: NormalizedSides,
	responseDistance?: number,
) {
	"worklet";
	const xDist = responseDistance ?? DEFAULT_EDGE_DISTANCE_HORIZONTAL;
	const yDist = responseDistance ?? DEFAULT_EDGE_DISTANCE_VERTICAL;

	return {
		horizontalRight: canActivateFromStartEdge(
			sides.left,
			initialTouch.x,
			xDist,
		),
		horizontalLeft: canActivateFromEndEdge(
			sides.right,
			initialTouch.x,
			dimensions.width,
			xDist,
		),
		verticalDown: canActivateFromStartEdge(sides.top, initialTouch.y, yDist),
		verticalUp: canActivateFromEndEdge(
			sides.bottom,
			initialTouch.y,
			dimensions.height,
			yDist,
		),
	} as const;
}

export function calculateSwipeDirs(deltaX: number, deltaY: number) {
	"worklet";

	const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
	const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

	const isSwipingDown = isVerticalSwipe && deltaY > 0;
	const isSwipingUp = isVerticalSwipe && deltaY < 0;
	const isSwipingRight = isHorizontalSwipe && deltaX > 0;
	const isSwipingLeft = isHorizontalSwipe && deltaX < 0;

	return {
		isSwipingDown,
		isSwipingUp,
		isSwipingRight,
		isSwipingLeft,
		isVerticalSwipe,
		isHorizontalSwipe,
	};
}

const shouldFailDirectionalGate = (
	isDirectionSwipe: boolean,
	allowed: boolean,
	gate: boolean,
) => {
	"worklet";
	return isDirectionSwipe && (!allowed || !gate);
};

const resolveAxisActivation = ({
	movement,
	deviation,
	movementThreshold,
	deviationTolerance,
	positiveSwipe,
	negativeSwipe,
	positiveAllowed,
	negativeAllowed,
	positiveGate,
	negativeGate,
}: AxisActivationProps): ActivationResult => {
	"worklet";
	if (
		shouldFailDirectionalGate(positiveSwipe, positiveAllowed, positiveGate) ||
		shouldFailDirectionalGate(negativeSwipe, negativeAllowed, negativeGate) ||
		Math.abs(deviation) > deviationTolerance
	) {
		return { shouldActivate: false, shouldFail: true };
	}

	if (Math.abs(movement) < movementThreshold) {
		return { shouldActivate: false, shouldFail: false };
	}

	return {
		shouldActivate:
			(positiveSwipe && positiveAllowed && positiveGate) ||
			(negativeSwipe && negativeAllowed && negativeGate),
		shouldFail: false,
	};
};

export function shouldActivateOrFail(params: ShouldActivateOrFailProps) {
	"worklet";
	const hasHorizontal = params.allowedLeft || params.allowedRight;
	const hasVertical = params.allowedUp || params.allowedDown;

	if (hasHorizontal && params.isHorizontalSwipe) {
		return resolveAxisActivation({
			movement: params.deltaX,
			deviation: params.deltaY,
			movementThreshold: GESTURE_ACTIVATION_THRESHOLD_X,
			deviationTolerance: GESTURE_FAIL_TOLERANCE_X,
			positiveSwipe: params.isSwipingRight,
			negativeSwipe: params.isSwipingLeft,
			positiveAllowed: params.allowedRight,
			negativeAllowed: params.allowedLeft,
			positiveGate: params.horizontalGateRight,
			negativeGate: params.horizontalGateLeft,
		});
	}

	if (hasVertical && params.isVerticalSwipe) {
		return resolveAxisActivation({
			movement: params.deltaY,
			deviation: params.deltaX,
			movementThreshold: GESTURE_ACTIVATION_THRESHOLD_Y,
			deviationTolerance: GESTURE_FAIL_TOLERANCE_Y,
			positiveSwipe: params.isSwipingUp,
			negativeSwipe: params.isSwipingDown,
			positiveAllowed: params.allowedUp,
			negativeAllowed: params.allowedDown,
			positiveGate: params.verticalGateUp,
			negativeGate: params.verticalGateDown,
		});
	}

	return { shouldActivate: false, shouldFail: false };
}

const getNextActivationState = (
	activationState: GestureActivationState,
	shouldActivate: boolean,
	shouldFail: boolean,
) => {
	"worklet";
	if (shouldActivate) {
		return GestureActivationState.PASSED;
	}

	if (shouldFail) {
		return GestureActivationState.FAILED;
	}

	return activationState;
};

/**
 * Since we're using onTouchesMove to activate our pan, faillOffset and activateOffset don't actually work. In that case we'll create this function to use in onTouchesMove which acts simarly to the original functionality.
 */
export const resolveOffsetRules = ({
	initialTouch,
	touch,
	directions,
	activationState,
	activationArea,
	dimensions,
	responseDistance,
}: ResolveOffsetRulesProps): OffsetRuleResult => {
	"worklet";

	const deltaX = touch.x - initialTouch.x;
	const deltaY = touch.y - initialTouch.y;

	const allowedDown = directions.vertical;
	const allowedUp = directions.verticalInverted;
	const allowedRight = directions.horizontal;
	const allowedLeft = directions.horizontalInverted;

	const {
		isSwipingDown,
		isSwipingUp,
		isSwipingRight,
		isSwipingLeft,
		isVerticalSwipe,
		isHorizontalSwipe,
	} = calculateSwipeDirs(deltaX, deltaY);

	if (activationState !== GestureActivationState.PENDING) {
		return {
			isSwipingDown,
			isSwipingUp,
			isSwipingRight,
			isSwipingLeft,
			nextActivationState: activationState,
		};
	}

	const sides = normalizeSides(activationArea);

	const {
		horizontalRight: horizontalGateRight,
		horizontalLeft: horizontalGateLeft,
		verticalDown: verticalGateDown,
		verticalUp: verticalGateUp,
	} = computeEdgeConstraints(initialTouch, dimensions, sides, responseDistance);

	const { shouldActivate, shouldFail } = shouldActivateOrFail({
		deltaX,
		deltaY,
		isHorizontalSwipe,
		isVerticalSwipe,
		allowedRight,
		allowedLeft,
		allowedUp,
		allowedDown,
		horizontalGateRight,
		horizontalGateLeft,
		verticalGateUp,
		verticalGateDown,
		isSwipingRight,
		isSwipingLeft,
		isSwipingUp,
		isSwipingDown,
	});

	return {
		isSwipingDown,
		isSwipingUp,
		isSwipingRight,
		isSwipingLeft,
		nextActivationState: getNextActivationState(
			activationState,
			shouldActivate,
			shouldFail,
		),
	};
};

const getScrollBoundaryState = (
	scrollState: ScrollGestureState,
	direction: Direction,
): BoundaryState => {
	"worklet";
	const isVerticalDirection =
		direction === "vertical" || direction === "vertical-inverted";

	const axisState = isVerticalDirection
		? scrollState.vertical
		: scrollState.horizontal;

	const maxScrollOffset = Math.max(
		0,
		axisState.contentSize - axisState.layoutSize,
	);

	return {
		atStart: axisState.offset <= SCROLL_EPILSON,
		atEnd: axisState.offset >= maxScrollOffset - SCROLL_EPILSON,
	};
};

const canYieldAtBoundary = (
	direction: Direction,
	{ atStart, atEnd }: BoundaryState,
) => {
	"worklet";
	switch (direction) {
		case "vertical":
		case "horizontal":
			return atStart;

		case "vertical-inverted":
		case "horizontal-inverted":
			return atEnd;

		default:
			return true;
	}
};

/**
 * Checks if a ScrollView is at its boundary for the given swipe direction.
 * This is a simplified boundary check that respects axis isolation.
 *
 * Per the spec:
 * - A vertical ScrollView never yields to horizontal gestures
 * - A horizontal ScrollView never yields to vertical gestures
 * - ScrollView must be at boundary before yielding control
 *
 * For snap point sheets, the boundary depends on where the sheet originates from:
 * - Bottom sheet (vertical): scrollY = 0 (top/base)
 * - Top sheet (verticalInverted): scrollY >= maxY (bottom/end)
 * - Right drawer (horizontal): scrollX = 0 (left/base)
 * - Left drawer (horizontalInverted): scrollX >= maxX (right/end)
 *
 * The rule: "when the ScrollView can't scroll any further in the direction
 * the sheet came from, yield to the gesture."
 *
 * @param scrollState - The current scroll coordination state
 * @param direction - The swipe direction to check
 * @param snapAxisInverted - For snap point sheets, whether the axis is inverted (top sheet / left drawer)
 * @returns true if at boundary (gesture should activate), false otherwise
 */
export function checkScrollBoundary(
	scrollState: ScrollGestureState | null,
	direction: Direction,
	snapAxisInverted?: boolean,
): boolean {
	"worklet";

	if (!scrollState) {
		// No scroll config means no ScrollView - allow gesture
		return true;
	}

	const boundary = getScrollBoundaryState(scrollState, direction);

	// For snap point sheets (snapAxisInverted is defined), boundary depends on sheet origin
	// Even if content isn't scrollable, respect bounce/overscroll state
	if (snapAxisInverted !== undefined) {
		// Bottom sheet / right drawer (not inverted): boundary at scroll start
		// Top sheet / left drawer (inverted): boundary at scroll end
		return snapAxisInverted ? boundary.atEnd : boundary.atStart;
	}

	return canYieldAtBoundary(direction, boundary);
}
