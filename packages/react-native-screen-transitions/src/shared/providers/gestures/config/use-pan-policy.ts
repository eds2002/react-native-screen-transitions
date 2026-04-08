import { useMemo } from "react";
import {
	DEFAULT_GESTURE_ACTIVATION_AREA,
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_DRIVES_PROGRESS,
	DEFAULT_GESTURE_RELEASE_VELOCITY_MAX,
	DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
	DEFAULT_GESTURE_SNAP_LOCKED,
	DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
	DEFAULT_GESTURE_VELOCITY_IMPACT,
	DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR,
} from "../../../constants";
import { useDescriptors } from "../../screen/descriptors";
import {
	getSnapAxis,
	resolveGestureDirections,
	warnOnSnapDirectionArray,
} from "../helpers/gesture-directions";
import type { PanGesturePolicy, ScreenGestureConfig } from "../types";

interface UsePanPolicyProps {
	effectiveSnapPoints: ScreenGestureConfig["effectiveSnapPoints"];
}

export function usePanPolicy({
	effectiveSnapPoints,
}: UsePanPolicyProps): PanGesturePolicy {
	const {
		current: { options },
	} = useDescriptors();

	const { hasSnapPoints } = effectiveSnapPoints;

	return useMemo(() => {
		const gestureDirection =
			options.gestureDirection ?? DEFAULT_GESTURE_DIRECTION;

		warnOnSnapDirectionArray({
			gestureDirection,
			hasSnapPoints,
		});

		const directions = resolveGestureDirections({
			gestureDirection,
			hasSnapPoints,
		});

		return {
			gestureDirection,
			directions,
			snapAxis: getSnapAxis(directions),
			gestureDrivesProgress:
				options.gestureDrivesProgress ?? DEFAULT_GESTURE_DRIVES_PROGRESS,
			gestureVelocityImpact:
				options.gestureVelocityImpact ?? DEFAULT_GESTURE_VELOCITY_IMPACT,
			snapVelocityImpact:
				options.snapVelocityImpact ?? DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
			gestureReleaseVelocityScale:
				options.gestureReleaseVelocityScale ??
				DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
			gestureReleaseVelocityMax:
				options.gestureReleaseVelocityMax ??
				DEFAULT_GESTURE_RELEASE_VELOCITY_MAX,
			gestureActivationArea:
				options.gestureActivationArea ?? DEFAULT_GESTURE_ACTIVATION_AREA,
			gestureSnapLocked:
				options.gestureSnapLocked ?? DEFAULT_GESTURE_SNAP_LOCKED,
			sheetScrollGestureBehavior:
				options.sheetScrollGestureBehavior ??
				DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR,
			gestureResponseDistance: options.gestureResponseDistance,
			transitionSpec: options.transitionSpec,
		};
	}, [options, hasSnapPoints]);
}
