import type { GestureStateManagerType } from "react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager";
import type { SharedValue } from "react-native-reanimated";
import type { ScrollConfig } from "../../providers/gestures.provider";
import {
	type ActivationArea,
	type GestureActivationArea,
	GestureOffsetState,
	type SideActivation,
} from "../../types/gesture.types";
import type { Layout } from "../../types/screen.types";

type Directions = {
	vertical: boolean;
	verticalInverted: boolean;
	horizontal: boolean;
	horizontalInverted: boolean;
	snapAxisInverted?: boolean;
};

interface CheckGestureActivationProps {
	initialTouch: { x: number; y: number };
	touch: { x: number; y: number };
	directions: Directions;
	manager?: GestureStateManagerType;
	gestureOffsetState: SharedValue<GestureOffsetState>;
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
	hasHorizontal: boolean;
	hasVertical: boolean;
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

export function computeEdgeConstraints(
	initialTouch: { x: number; y: number },
	dimensions: Layout,
	sides: NormalizedSides,
	responseDistance?: number,
) {
	"worklet";
	const xDist = responseDistance ?? DEFAULT_EDGE_DISTANCE_HORIZONTAL;
	const yDist = responseDistance ?? DEFAULT_EDGE_DISTANCE_VERTICAL;

	const horizontalRight = sides.left === "screen" || initialTouch.x <= xDist; // right swipe checks left edge
	const horizontalLeft =
		sides.right === "screen" || initialTouch.x >= dimensions.width - xDist; // left swipe checks right edge
	const verticalDown = sides.top === "screen" || initialTouch.y <= yDist; // down swipe checks top edge
	const verticalUp =
		sides.bottom === "screen" || initialTouch.y >= dimensions.height - yDist; // up swipe checks bottom edge

	return { horizontalRight, horizontalLeft, verticalDown, verticalUp } as const;
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

export function shouldActivateOrFail(params: ShouldActivateOrFailProps) {
	"worklet";

	const {
		deltaX,
		deltaY,
		hasHorizontal,
		hasVertical,
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
	} = params;

	let shouldActivate = false;
	let shouldFail = false;

	if (hasHorizontal && isHorizontalSwipe) {
		const hasEnoughHorizontalMovement =
			Math.abs(deltaX) >= GESTURE_ACTIVATION_THRESHOLD_X;

		const hasAcceptableVerticalDeviation =
			Math.abs(deltaY) <= GESTURE_FAIL_TOLERANCE_X;

		if (hasEnoughHorizontalMovement && hasAcceptableVerticalDeviation) {
			const rightOk = isSwipingRight && allowedRight && horizontalGateRight;
			const leftOk = isSwipingLeft && allowedLeft && horizontalGateLeft;
			if (rightOk || leftOk) {
				shouldActivate = true;
			}
		} else if (!hasAcceptableVerticalDeviation) {
			shouldFail = true;
		}
	}

	if (hasVertical && isVerticalSwipe) {
		const hasEnoughVerticalMovement =
			Math.abs(deltaY) >= GESTURE_ACTIVATION_THRESHOLD_Y;
		const hasAcceptableHorizontalDeviation =
			Math.abs(deltaX) <= GESTURE_FAIL_TOLERANCE_Y;

		if (hasEnoughVerticalMovement && hasAcceptableHorizontalDeviation) {
			const upOk = isSwipingUp && allowedUp && verticalGateUp;
			const downOk = isSwipingDown && allowedDown && verticalGateDown;
			if (upOk || downOk) {
				shouldActivate = true;
			}
		} else if (!hasAcceptableHorizontalDeviation) {
			shouldFail = true;
		}
	}

	if (hasHorizontal && isHorizontalSwipe) {
		if ((isSwipingLeft && !allowedLeft) || (isSwipingRight && !allowedRight)) {
			shouldFail = true;
		}
		// If gating prohibits the dominant horizontal swipe, fail early
		if (
			(isSwipingRight && allowedRight && !horizontalGateRight) ||
			(isSwipingLeft && allowedLeft && !horizontalGateLeft)
		) {
			shouldFail = true;
		}
	}

	if (hasVertical && isVerticalSwipe) {
		if ((isSwipingUp && !allowedUp) || (isSwipingDown && !allowedDown)) {
			shouldFail = true;
		}
		// If gating prohibits the dominant vertical swipe, fail early
		if (
			(isSwipingUp && allowedUp && !verticalGateUp) ||
			(isSwipingDown && allowedDown && !verticalGateDown)
		) {
			shouldFail = true;
		}
	}

	return { shouldActivate, shouldFail };
}

/**
 * Since we're using onTouchesMove to activate our pan, faillOffset and activateOffset don't actually work. In that case we'll create this function to use in onTouchesMove which acts simarly to the original functionality.
 */
export const applyOffsetRules = ({
	initialTouch,
	touch,
	directions,
	manager,
	gestureOffsetState,
	activationArea,
	dimensions,
	responseDistance,
}: CheckGestureActivationProps): ReturnValues => {
	"worklet";

	const deltaX = touch.x - initialTouch.x;
	const deltaY = touch.y - initialTouch.y;

	const allowedDown = directions.vertical;
	const allowedUp = directions.verticalInverted;
	const allowedRight = directions.horizontal;
	const allowedLeft = directions.horizontalInverted;

	const hasHorizontal = allowedLeft || allowedRight;
	const hasVertical = allowedUp || allowedDown;

	const {
		isSwipingDown,
		isSwipingUp,
		isSwipingRight,
		isSwipingLeft,
		isVerticalSwipe,
		isHorizontalSwipe,
	} = calculateSwipeDirs(deltaX, deltaY);

	if (gestureOffsetState.value !== GestureOffsetState.PENDING) {
		return {
			isSwipingDown,
			isSwipingUp,
			isSwipingRight,
			isSwipingLeft,
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
		hasHorizontal,
		hasVertical,
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

	if (shouldActivate) {
		gestureOffsetState.value = GestureOffsetState.PASSED;
	} else if (shouldFail) {
		gestureOffsetState.value = GestureOffsetState.FAILED;
		manager?.fail();
	}

	return {
		isSwipingDown,
		isSwipingUp,
		isSwipingRight,
		isSwipingLeft,
	};
};

interface ScrollAwareActivationParams {
	swipeInfo: {
		isSwipingDown: boolean;
		isSwipingUp: boolean;
		isSwipingRight: boolean;
		isSwipingLeft: boolean;
	};
	directions: Directions;
	scrollConfig: ScrollConfig | null;
	hasSnapPoints?: boolean;
	canExpandMore?: boolean;
}

type GestureDirection =
	| "vertical"
	| "vertical-inverted"
	| "horizontal"
	| "horizontal-inverted";

/**
 * Checks if a gesture should activate based on scroll position.
 * Returns the direction to activate for, or null if activation should not occur.
 */
export function checkScrollAwareActivation({
	swipeInfo,
	directions,
	scrollConfig,
	hasSnapPoints,
	canExpandMore,
}: ScrollAwareActivationParams): {
	shouldActivate: boolean;
	direction: GestureDirection | null;
} {
	"worklet";

	const { isSwipingDown, isSwipingUp, isSwipingRight, isSwipingLeft } =
		swipeInfo;

	// Extract scroll values from config
	const scrollX = scrollConfig?.x ?? 0;
	const scrollY = scrollConfig?.y ?? 0;
	const maxScrollX = scrollConfig
		? scrollConfig.contentWidth - scrollConfig.layoutWidth
		: 0;
	const maxScrollY = scrollConfig
		? scrollConfig.contentHeight - scrollConfig.layoutHeight
		: 0;
	const snapAxisInverted = directions.snapAxisInverted;

	// With snap points, gestures should only activate based on the PRIMARY scroll edge
	// (the edge where the sheet originates from), not the opposite edge.
	// This prevents the auto-enabled opposite direction from hijacking scrolls.
	if (hasSnapPoints) {
		const isVerticalAxis = directions.vertical || directions.verticalInverted;
		const isHorizontalAxis =
			directions.horizontal || directions.horizontalInverted;

		if (isVerticalAxis) {
			if (snapAxisInverted) {
				// Sheet from TOP (vertical-inverted): only activate at scroll BOTTOM
				if (scrollY >= maxScrollY) {
					if (isSwipingUp) {
						return { shouldActivate: true, direction: "vertical-inverted" };
					}
					if (isSwipingDown && canExpandMore) {
						return { shouldActivate: true, direction: "vertical" };
					}
				}
			} else {
				// Sheet from BOTTOM (vertical): only activate at scroll TOP
				if (scrollY <= 0) {
					if (isSwipingDown) {
						return { shouldActivate: true, direction: "vertical" };
					}
					if (isSwipingUp && canExpandMore) {
						return { shouldActivate: true, direction: "vertical-inverted" };
					}
				}
			}
		}

		if (isHorizontalAxis) {
			if (snapAxisInverted) {
				// Sheet from LEFT (horizontal-inverted): only activate at scroll RIGHT
				if (scrollX >= maxScrollX) {
					if (isSwipingLeft) {
						return { shouldActivate: true, direction: "horizontal-inverted" };
					}
					if (isSwipingRight && canExpandMore) {
						return { shouldActivate: true, direction: "horizontal" };
					}
				}
			} else {
				// Sheet from RIGHT (horizontal): only activate at scroll LEFT
				if (scrollX <= 0) {
					if (isSwipingRight) {
						return { shouldActivate: true, direction: "horizontal" };
					}
					if (isSwipingLeft && canExpandMore) {
						return { shouldActivate: true, direction: "horizontal-inverted" };
					}
				}
			}
		}

		return { shouldActivate: false, direction: null };
	}

	if (directions.vertical && isSwipingDown && scrollY <= 0) {
		return { shouldActivate: true, direction: "vertical" };
	}

	if (directions.horizontal && isSwipingRight && scrollX <= 0) {
		return { shouldActivate: true, direction: "horizontal" };
	}

	if (directions.verticalInverted && isSwipingUp && scrollY >= maxScrollY) {
		return { shouldActivate: true, direction: "vertical-inverted" };
	}

	if (directions.horizontalInverted && isSwipingLeft && scrollX >= maxScrollX) {
		return { shouldActivate: true, direction: "horizontal-inverted" };
	}

	return { shouldActivate: false, direction: null };
}
