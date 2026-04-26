import { useMemo } from "react";
import {
	DEFAULT_GESTURE_ACTIVATION_AREA,
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_DRIVES_PROGRESS,
	DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
	DEFAULT_GESTURE_SENSITIVITY,
	DEFAULT_GESTURE_SNAP_LOCKED,
	DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
	DEFAULT_GESTURE_VELOCITY_IMPACT,
	DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR,
} from "../../../../constants";
import { useDescriptors } from "../../../screen/descriptors";
import {
	getActivationGestureDirections,
	getPanGestureDirections,
	getSnapPanDirectionConfig,
} from "../helpers/gesture-directions";
import type { PanGesturePolicy, ScreenGestureConfig } from "../types";

export function usePanPolicy(config: ScreenGestureConfig): PanGesturePolicy {
	const {
		current: { options },
	} = useDescriptors();

	const { hasSnapPoints } = config.effectiveSnapPoints;

	return useMemo(() => {
		const gestureDirection =
			options.gestureDirection ?? DEFAULT_GESTURE_DIRECTION;

		const panActivationDirections = getActivationGestureDirections({
			gestureDirection,
			hasSnapPoints,
		});
		const hasPanDirection =
			getPanGestureDirections(gestureDirection).length > 0;

		return {
			enabled: hasPanDirection,
			gestureDirection,
			directions: panActivationDirections,
			snapDirections: getSnapPanDirectionConfig(gestureDirection),
			gestureDrivesProgress:
				options.gestureDrivesProgress ?? DEFAULT_GESTURE_DRIVES_PROGRESS,
			gestureSensitivity:
				options.gestureSensitivity ?? DEFAULT_GESTURE_SENSITIVITY,
			gestureVelocityImpact:
				options.gestureVelocityImpact ?? DEFAULT_GESTURE_VELOCITY_IMPACT,
			gestureSnapVelocityImpact:
				options.gestureSnapVelocityImpact ??
				DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
			gestureReleaseVelocityScale:
				options.gestureReleaseVelocityScale ??
				DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
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
