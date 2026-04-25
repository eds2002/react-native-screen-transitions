import { useMemo } from "react";
import {
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_DRIVES_PROGRESS,
	DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
	DEFAULT_GESTURE_SENSITIVITY,
	DEFAULT_GESTURE_SNAP_LOCKED,
	DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
	DEFAULT_GESTURE_VELOCITY_IMPACT,
} from "../../../../constants";
import { useDescriptors } from "../../../screen/descriptors";
import { getPinchGestureDirections } from "../helpers/gesture-directions";
import type { PinchGesturePolicy, ScreenGestureConfig } from "../types";

export function usePinchPolicy(
	config: ScreenGestureConfig,
): PinchGesturePolicy {
	const {
		current: { options },
	} = useDescriptors();

	const { canDismiss } = config;
	const { hasSnapPoints } = config.effectiveSnapPoints;

	return useMemo(() => {
		const gestureDirection =
			options.gestureDirection ?? DEFAULT_GESTURE_DIRECTION;
		const pinchDirections = getPinchGestureDirections(gestureDirection);
		const hasPinchDirection = pinchDirections.length > 0;
		const pinchInEnabled =
			pinchDirections.includes("pinch-in") ||
			(hasSnapPoints && hasPinchDirection);
		const pinchOutEnabled =
			pinchDirections.includes("pinch-out") ||
			(hasSnapPoints && hasPinchDirection);

		return {
			enabled:
				(canDismiss || hasSnapPoints) && (pinchInEnabled || pinchOutEnabled),
			gestureDirection,
			pinchInEnabled,
			pinchOutEnabled,
			gestureDrivesProgress:
				options.gestureDrivesProgress ?? DEFAULT_GESTURE_DRIVES_PROGRESS,
			gestureSensitivity:
				options.gestureSensitivity ?? DEFAULT_GESTURE_SENSITIVITY,
			gestureVelocityImpact:
				options.gestureVelocityImpact ?? DEFAULT_GESTURE_VELOCITY_IMPACT,
			gestureSnapVelocityImpact:
				options.gestureSnapVelocityImpact ??
				DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
			gestureSnapLocked:
				options.gestureSnapLocked ?? DEFAULT_GESTURE_SNAP_LOCKED,
			gestureReleaseVelocityScale:
				options.gestureReleaseVelocityScale ??
				DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
			transitionSpec: options.transitionSpec,
		};
	}, [canDismiss, hasSnapPoints, options]);
}
