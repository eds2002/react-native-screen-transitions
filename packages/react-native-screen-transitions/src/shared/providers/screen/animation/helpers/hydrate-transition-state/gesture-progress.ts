import { clamp } from "react-native-reanimated";
import {
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_PROGRESS_MODE,
	EPSILON,
} from "../../../../../constants";
import type { ScreenTransitionOptions } from "../../../../../types/animation.types";
import type {
	GestureDirection,
	GestureValues,
} from "../../../../../types/gesture.types";
import { resolveGestureProgressModeFromOptions } from "../../../../../utils/gesture-progress-mode";
import {
	getPanActivationDirections,
	getPanSnapAxisConfigForDirection,
	getPanSnapAxisDirections,
	getPinchGestureDirections,
	getSnapPinchDirectionConfig,
	isResolvedPanGestureDirection,
} from "../../../gestures/shared/directions";
import type { SnapBounds } from "./types";

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

		return clamp(baseProgress + progressDelta, snapBounds.min, snapBounds.max);
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

	return clamp(baseProgress - progressOffset, 0, baseProgress);
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

		return clamp(baseProgress + progressDelta, snapBounds.min, snapBounds.max);
	}

	const pinchDirections = getPinchGestureDirections(gestureDirection);
	if (!pinchDirections.includes(pinchDirection)) {
		return baseProgress;
	}

	return clamp(baseProgress - Math.abs(gesture.normScale), 0, baseProgress);
};

export const resolveGestureDrivenProgress = (
	baseProgress: number,
	gesture: GestureValues,
	options: ScreenTransitionOptions,
	effectiveOptions: ScreenTransitionOptions | undefined,
	snapBounds: SnapBounds | null,
) => {
	"worklet";
	const gestureProgressMode = resolveGestureProgressModeFromOptions(
		effectiveOptions,
		options,
		DEFAULT_GESTURE_PROGRESS_MODE,
	);

	if (gestureProgressMode === "freeform") {
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
