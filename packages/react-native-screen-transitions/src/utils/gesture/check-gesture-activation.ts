import type { GestureStateManagerType } from "react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager";
import type { SharedValue } from "react-native-reanimated";

type Directions = {
	vertical: boolean;
	verticalInverted: boolean;
	horizontal: boolean;
	horizontalInverted: boolean;
};

interface CheckGestureActivationProps {
	initialTouch: { x: number; y: number };
	touch: { x: number; y: number };
	directions: Directions;
	manager?: GestureStateManagerType;
	activationState: SharedValue<"pending" | "activated" | "failed">;
}

const GESTURE_ACTIVATION_THRESHOLD_X = 5;
const GESTURE_ACTIVATION_THRESHOLD_Y = 5;

const GESTURE_FAIL_TOLERANCE_X = 15;
const GESTURE_FAIL_TOLERANCE_Y = 20;

/**
 * Since we're using onTouchesMove to activate our pan, faillOffset and activateOffset don't actually work. In that case we'll create this function to use in onTouchesMove which acts simarly to the original functionality.
 */
export const checkGestureActivation = ({
	initialTouch,
	touch,
	directions,
	manager,
	activationState,
}: CheckGestureActivationProps): {
	canProceed: boolean;
	isSwipingDown: boolean;
	isSwipingUp: boolean;
	isSwipingRight: boolean;
	isSwipingLeft: boolean;
} => {
	"worklet";

	const deltaX = touch.x - initialTouch.x;
	const deltaY = touch.y - initialTouch.y;

	const allowedDown = directions.vertical;
	const allowedUp = directions.verticalInverted;
	const allowedRight = directions.horizontal;
	const allowedLeft = directions.horizontalInverted;

	const hasHorizontal = allowedLeft || allowedRight;
	const hasVertical = allowedUp || allowedDown;

	const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
	const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

	const isSwipingDown = isVerticalSwipe && deltaY > 0;
	const isSwipingUp = isVerticalSwipe && deltaY < 0;
	const isSwipingRight = isHorizontalSwipe && deltaX > 0;
	const isSwipingLeft = isHorizontalSwipe && deltaX < 0;

	if (activationState.value === "activated") {
		return {
			canProceed: true,
			isSwipingDown,
			isSwipingUp,
			isSwipingRight,
			isSwipingLeft,
		};
	}

	if (activationState.value === "failed") {
		return {
			canProceed: false,
			isSwipingDown,
			isSwipingUp,
			isSwipingRight,
			isSwipingLeft,
		};
	}

	let shouldActivate = false;
	let shouldFail = false;

	if (hasHorizontal && isHorizontalSwipe) {
		const hasEnoughHorizontalMovement =
			Math.abs(deltaX) >= GESTURE_ACTIVATION_THRESHOLD_X;
		const hasAcceptableVerticalDeviation =
			Math.abs(deltaY) <= GESTURE_FAIL_TOLERANCE_X;

		if (hasEnoughHorizontalMovement && hasAcceptableVerticalDeviation) {
			if ((allowedLeft && isSwipingLeft) || (allowedRight && isSwipingRight)) {
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
			if ((allowedUp && isSwipingUp) || (allowedDown && isSwipingDown)) {
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
	}

	if (hasVertical && isVerticalSwipe) {
		if ((isSwipingUp && !allowedUp) || (isSwipingDown && !allowedDown)) {
			shouldFail = true;
		}
	}

	if (shouldActivate) {
		activationState.value = "activated";
	} else if (shouldFail) {
		activationState.value = "failed";
		manager?.fail();
	}

	return {
		canProceed: shouldActivate,
		isSwipingDown,
		isSwipingUp,
		isSwipingRight,
		isSwipingLeft,
	};
};
