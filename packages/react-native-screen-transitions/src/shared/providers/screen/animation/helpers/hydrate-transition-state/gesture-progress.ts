import {
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_DRIVES_PROGRESS,
	EPSILON,
} from "../../../../../constants";
import type { ScreenTransitionOptions } from "../../../../../types/animation.types";
import type {
	GestureDirection,
	GestureValues,
} from "../../../../../types/gesture.types";
import {
	getPanActivationDirections,
	getPanSnapAxisConfigForDirection,
	getPanSnapAxisDirections,
	getPinchGestureDirections,
	getSnapPinchDirectionConfig,
	isResolvedPanGestureDirection,
} from "../../../gestures/helpers/gesture-directions";
import type { SnapBounds } from "./types";

const clampProgress = (value: number, min = 0, max = 1) => {
	"worklet";
	return Math.max(min, Math.min(max, value));
};

const resolvePanGestureDrivenProgress = (
	baseProgress: number,
	gesture: GestureValues,
	gestureDirection: GestureDirection | GestureDirection[],
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
			return baseProgress;
		}

		const axisValue =
			activeAxis.axis === "horizontal" ? gesture.normX : gesture.normY;
		const progressDelta = activeAxis.config.progressSign * axisValue;

		return clampProgress(
			baseProgress + progressDelta,
			snapBounds.min,
			snapBounds.max,
		);
	}

	const directions = getPanActivationDirections({
		gestureDirection,
		hasSnapPoints: false,
	});
	let progressOffset = 0;

	if (directions.horizontal && gesture.normX > 0) {
		progressOffset = Math.max(progressOffset, gesture.normX);
	}

	if (directions.horizontalInverted && gesture.normX < 0) {
		progressOffset = Math.max(progressOffset, -gesture.normX);
	}

	if (directions.vertical && gesture.normY > 0) {
		progressOffset = Math.max(progressOffset, gesture.normY);
	}

	if (directions.verticalInverted && gesture.normY < 0) {
		progressOffset = Math.max(progressOffset, -gesture.normY);
	}

	return clampProgress(baseProgress - progressOffset, 0, baseProgress);
};

const resolvePinchGestureDrivenProgress = (
	baseProgress: number,
	gesture: GestureValues,
	gestureDirection: GestureDirection | GestureDirection[],
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
		return baseProgress;
	}

	if (hasSnapPoints) {
		const snapDirections = getSnapPinchDirectionConfig(gestureDirection);
		if (!snapDirections || !snapBounds) {
			return baseProgress;
		}

		const progressDelta =
			snapDirections.collapse === pinchDirection
				? -Math.abs(gesture.normScale)
				: Math.abs(gesture.normScale);

		return clampProgress(
			baseProgress + progressDelta,
			snapBounds.min,
			snapBounds.max,
		);
	}

	const pinchDirections = getPinchGestureDirections(gestureDirection);
	if (!pinchDirections.includes(pinchDirection)) {
		return baseProgress;
	}

	return clampProgress(
		baseProgress - Math.abs(gesture.normScale),
		0,
		baseProgress,
	);
};

export const resolveGestureDrivenProgress = (
	baseProgress: number,
	gesture: GestureValues,
	options: ScreenTransitionOptions,
	effectiveOptions: ScreenTransitionOptions | undefined,
	snapBounds: SnapBounds | null,
) => {
	"worklet";
	const gestureDrivesProgress =
		effectiveOptions?.gestureDrivesProgress ??
		options.gestureDrivesProgress ??
		DEFAULT_GESTURE_DRIVES_PROGRESS;

	if (!gestureDrivesProgress) {
		return baseProgress;
	}

	const gestureDirection =
		effectiveOptions?.gestureDirection ??
		options.gestureDirection ??
		DEFAULT_GESTURE_DIRECTION;

	const hasSnapPoints = snapBounds !== null;

	if (
		gesture.active === "pinch-in" ||
		gesture.active === "pinch-out" ||
		Math.abs(gesture.normScale) > EPSILON
	) {
		return resolvePinchGestureDrivenProgress(
			baseProgress,
			gesture,
			gestureDirection,
			hasSnapPoints,
			snapBounds,
		);
	}

	return resolvePanGestureDrivenProgress(
		baseProgress,
		gesture,
		gestureDirection,
		hasSnapPoints,
		snapBounds,
	);
};
