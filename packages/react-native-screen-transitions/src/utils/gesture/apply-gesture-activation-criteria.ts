import type { PanGesture } from "react-native-gesture-handler";

type Directions = {
	vertical: boolean;
	verticalInverted: boolean;
	horizontal: boolean;
	horizontalInverted: boolean;
};

interface GestureActivationOptions {
	gestureResponseDistance: number;
	panGesture: PanGesture;
	directions: Directions;
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
}: GestureActivationOptions) => {
	if (Object.values(directions).every(Boolean)) {
		return {
			activeOffsetX: [
				-gestureResponseDistance,
				gestureResponseDistance,
			] as OffsetErrorTypeBugFix,
			activeOffsetY: [
				-gestureResponseDistance,
				gestureResponseDistance,
			] as OffsetErrorTypeBugFix,
		};
	}

	const allowedDown = directions.vertical;
	const allowedUp = directions.verticalInverted;
	const allowedRight = directions.horizontal;
	const allowedLeft = directions.horizontalInverted;

	const dist = gestureResponseDistance;

	const result: {
		activeOffsetX?: number | [number, number];
		failOffsetX?: number | OffsetErrorTypeBugFix;
		activeOffsetY?: number | [number, number];
		failOffsetY?: number | OffsetErrorTypeBugFix;
	} = {};

	const hasHorizontal = allowedLeft || allowedRight;
	if (hasHorizontal) {
		if (allowedLeft && allowedRight) {
			result.activeOffsetX = [-dist, dist];
		} else if (allowedLeft) {
			result.activeOffsetX = -dist;
		} else if (allowedRight) {
			result.activeOffsetX = dist;
		}

		if (allowedRight && !allowedLeft) {
			result.failOffsetX = -dist;
		} else if (allowedLeft && !allowedRight) {
			result.failOffsetX = dist;
		}
	} else {
		result.failOffsetX = [
			-GESTURE_FAIL_TOLERANCE_X,
			GESTURE_FAIL_TOLERANCE_X,
		] as OffsetErrorTypeBugFix;
	}

	const hasVertical = allowedUp || allowedDown;
	if (hasVertical) {
		if (allowedUp && allowedDown) {
			result.activeOffsetY = [-dist, dist];
		} else if (allowedUp) {
			result.activeOffsetY = -dist;
		} else if (allowedDown) {
			result.activeOffsetY = dist;
		}

		if (allowedDown && !allowedUp) {
			result.failOffsetY = -dist;
		} else if (allowedUp && !allowedDown) {
			result.failOffsetY = dist;
		}
	} else {
		result.failOffsetY = [
			-GESTURE_FAIL_TOLERANCE_Y,
			GESTURE_FAIL_TOLERANCE_Y,
		] as OffsetErrorTypeBugFix;
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
