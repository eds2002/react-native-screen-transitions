import { clamp } from "react-native-reanimated";
import { DEFAULT_GESTURE_DIRECTION, EPSILON } from "../../../../../constants";
import type {
	GestureDirectionOption,
	GestureValues,
} from "../../../../../types/gesture.types";
import {
	getPanActivationDirections,
	getPanSnapAxisConfigForDirection,
	getPanSnapAxisDirections,
	getPinchGestureDirections,
	getSnapPinchDirectionConfig,
	isResolvedPanGestureDirection,
} from "../../../gestures/shared/directions";
import type { SnapBounds } from "./types";

type PanProgressDelta = {
	x: number;
	y: number;
};

const resolvePanGestureAffectedProgress = (
	transitionProgress: number,
	gesture: GestureValues,
	progressDelta: PanProgressDelta,
	gestureDirection: GestureDirectionOption,
	hasSnapPoints: boolean,
	snapBounds: SnapBounds | null,
) => {
	"worklet";

	if (hasSnapPoints) {
		const activeGesture = gesture.active;
		const activeAxis = isResolvedPanGestureDirection(activeGesture)
			? getPanSnapAxisConfigForDirection(
					getPanSnapAxisDirections(gestureDirection),
					activeGesture,
				)
			: null;

		if (!activeAxis || !snapBounds) {
			return transitionProgress;
		}

		const axisValue =
			activeAxis.axis === "horizontal" ? progressDelta.x : progressDelta.y;
		const signedProgressDelta = activeAxis.config.progressSign * axisValue;

		return clamp(
			transitionProgress + signedProgressDelta,
			snapBounds.min,
			snapBounds.max,
		);
	}

	const directions = getPanActivationDirections({
		gestureDirection,
		hasSnapPoints: false,
	});
	let progressOffset = 0;

	if (directions.horizontal && progressDelta.x > 0) {
		progressOffset = Math.max(progressOffset, progressDelta.x);
	}

	if (directions.horizontalInverted && progressDelta.x < 0) {
		progressOffset = Math.max(progressOffset, -progressDelta.x);
	}

	if (directions.vertical && progressDelta.y > 0) {
		progressOffset = Math.max(progressOffset, progressDelta.y);
	}

	if (directions.verticalInverted && progressDelta.y < 0) {
		progressOffset = Math.max(progressOffset, -progressDelta.y);
	}

	return clamp(transitionProgress - progressOffset, 0, transitionProgress);
};

const resolvePinchGestureAffectedProgress = (
	transitionProgress: number,
	gesture: GestureValues,
	gestureDirection: GestureDirectionOption,
	hasSnapPoints: boolean,
	snapBounds: SnapBounds | null,
) => {
	"worklet";
	const pinchDirection =
		gesture.normScale < 0
			? "pinch-in"
			: gesture.normScale > 0
				? "pinch-out"
				: null;

	if (!pinchDirection) {
		return transitionProgress;
	}

	if (hasSnapPoints) {
		const snapDirections = getSnapPinchDirectionConfig(gestureDirection);
		if (!snapDirections || !snapBounds) {
			return transitionProgress;
		}

		const progressDelta =
			snapDirections.collapse === pinchDirection
				? -Math.abs(gesture.normScale)
				: Math.abs(gesture.normScale);

		return clamp(
			transitionProgress + progressDelta,
			snapBounds.min,
			snapBounds.max,
		);
	}

	const pinchDirections = getPinchGestureDirections(gestureDirection);
	if (!pinchDirections.includes(pinchDirection)) {
		return transitionProgress;
	}

	return clamp(
		transitionProgress - Math.abs(gesture.normScale),
		0,
		transitionProgress,
	);
};

export const resolveGestureAffectedProgress = (
	transitionProgress: number,
	gesture: GestureValues,
	panProgressDelta: PanProgressDelta,
	gestureDirection: GestureDirectionOption | undefined,
	snapBounds: SnapBounds | null,
) => {
	"worklet";
	const resolvedGestureDirection =
		gestureDirection ?? DEFAULT_GESTURE_DIRECTION;

	const hasSnapPoints = snapBounds !== null;

	if (
		gesture.active === "pinch-in" ||
		gesture.active === "pinch-out" ||
		Math.abs(gesture.normScale) > EPSILON
	) {
		return resolvePinchGestureAffectedProgress(
			transitionProgress,
			gesture,
			resolvedGestureDirection,
			hasSnapPoints,
			snapBounds,
		);
	}

	return resolvePanGestureAffectedProgress(
		transitionProgress,
		gesture,
		panProgressDelta,
		resolvedGestureDirection,
		hasSnapPoints,
		snapBounds,
	);
};
