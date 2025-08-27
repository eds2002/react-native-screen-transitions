import type { PanGesture } from "react-native-gesture-handler";

type Directions = {
	vertical: boolean;
	verticalInverted: boolean;
	horizontal: boolean;
	horizontalInverted: boolean;
};

interface GestureActivationOptions {
	gestureResponseDistance: number | undefined;
	panGesture: PanGesture;
	directions: Directions;
}

interface GestureActivationResult {
	activeOffsetX?: number | [number, number];
	failOffsetX?: number | OffsetErrorTypeBugFix;
	activeOffsetY?: number | [number, number];
	failOffsetY?: number | OffsetErrorTypeBugFix;
}

const GESTURE_FAIL_TOLERANCE_X = 15;
const GESTURE_FAIL_TOLERANCE_Y = 20;
const GESTURE_RESPONSE_DISTANCE_HORIZONTAL = 50;
const GESTURE_RESPONSE_DISTANCE_VERTICAL = 135;

/**
 * rngh requires this type instead a number[]. We're returning a num[] which is still correct, this is just to remove the type error.
 */
type OffsetErrorTypeBugFix = [start: number, end: number];

export const applyGestureActivationCriteria = ({
	gestureResponseDistance,
	panGesture,
	directions,
}: GestureActivationOptions): PanGesture => {
	const xDist = gestureResponseDistance ?? GESTURE_RESPONSE_DISTANCE_HORIZONTAL;
	const yDist = gestureResponseDistance ?? GESTURE_RESPONSE_DISTANCE_VERTICAL;

	const allowedDown = directions.vertical;
	const allowedUp = directions.verticalInverted;
	const allowedRight = directions.horizontal;
	const allowedLeft = directions.horizontalInverted;

	const result: GestureActivationResult = {
		failOffsetX: [-GESTURE_FAIL_TOLERANCE_X, GESTURE_FAIL_TOLERANCE_X],
		failOffsetY: [-GESTURE_FAIL_TOLERANCE_Y, GESTURE_FAIL_TOLERANCE_Y],
	};

	const hasHorizontal = allowedLeft || allowedRight;
	const hasVertical = allowedUp || allowedDown;

	if (hasHorizontal) {
		if (allowedLeft && allowedRight) {
			result.activeOffsetX = [-xDist, xDist];
		} else if (allowedLeft) {
			result.activeOffsetX = -xDist;
		} else if (allowedRight) {
			result.activeOffsetX = xDist;
		}
	}

	if (hasVertical) {
		if (allowedUp && allowedDown) {
			result.activeOffsetY = [-yDist, yDist];
		} else if (allowedUp) {
			result.activeOffsetY = -yDist;
		} else if (allowedDown) {
			result.activeOffsetY = yDist;
		}
	}

	if (result?.activeOffsetX) {
		panGesture.activeOffsetX(result.activeOffsetX);
	}
	if (result?.activeOffsetY) {
		panGesture.activeOffsetY(result.activeOffsetY);
	}
	if (result?.failOffsetX) {
		panGesture.failOffsetX(result.failOffsetX);
	}
	if (result?.failOffsetY) {
		panGesture.failOffsetY(result.failOffsetY);
	}

	panGesture.enableTrackpadTwoFingerGesture(true);

	return panGesture;
};
