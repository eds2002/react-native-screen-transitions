import type { PanGesture } from "react-native-gesture-handler";
import type { TransitionConfig } from "../../types";

interface GestureActivationOptions {
	gestureDirection:
		| TransitionConfig["gestureDirection"]
		| Array<TransitionConfig["gestureDirection"]>;
	gestureResponseDistance: number;
	panGesture: PanGesture;
}

/**
 * rngh requires this type instead a number[]. We're returning a num[] which is still correct, this is just to remove the type error.
 */
type OffsetErrorTypeBugFix = [start: number, end: number];

export const applyGestureActivationCriteria = ({
	gestureDirection,
	gestureResponseDistance,
	panGesture,
}: GestureActivationOptions) => {
	const directions = Array.isArray(gestureDirection)
		? gestureDirection
		: [gestureDirection];

	if (directions.includes("bidirectional")) {
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

	const allowedDown = directions.includes("vertical");
	const allowedUp = directions.includes("vertical-inverted");
	const allowedRight = directions.includes("horizontal");
	const allowedLeft = directions.includes("horizontal-inverted");

	const toleranceX = 15;
	const toleranceY = 20;
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
		result.failOffsetX = [-toleranceX, toleranceX] as OffsetErrorTypeBugFix;
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
		result.failOffsetY = [-toleranceY, toleranceY] as OffsetErrorTypeBugFix;
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
