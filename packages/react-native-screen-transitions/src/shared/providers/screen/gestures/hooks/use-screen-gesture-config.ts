import { useMemo } from "react";
import {
	DEFAULT_GESTURE_ACTIVATION_AREA,
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_DRIVES_PROGRESS,
	DEFAULT_GESTURE_RELEASE_VELOCITY_MAX,
	DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
	DEFAULT_GESTURE_SENSITIVITY,
	DEFAULT_GESTURE_SNAP_LOCKED,
	DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
	DEFAULT_GESTURE_VELOCITY_IMPACT,
} from "../../../../constants";
import type { ScreenTransitionConfig } from "../../../../types";
import { resolveSheetScrollGestureBehavior } from "../../../../utils/resolve-screen-transition-options";
import { useDescriptorDerivations, useDescriptors } from "../../descriptors";
import { useGestureContext } from "../gestures.provider";
import {
	getPanActivationDirections,
	getPanGestureDirections,
	getPanSnapAxisDirections,
	getPinchGestureDirections,
	getSnapPinchDirectionConfig,
} from "../helpers/gesture-directions";
import { resolveCanTrackGesture } from "../helpers/resolve-can-track-gesture";
import { validateSnapPoints } from "../helpers/validate-snap-points";
import { computeClaimedDirections } from "../ownership/compute-claimed-directions";
import { resolveOwnership } from "../ownership/resolve-ownership";
import type {
	PanGesturePolicy,
	PinchGesturePolicy,
	ScreenGestureConfig,
	ScreenGestureParticipation,
} from "../types";

function resolvePanPolicy(
	options: ScreenTransitionConfig,
	hasSnapPoints: boolean,
): PanGesturePolicy {
	const gestureDirection =
		options.gestureDirection ?? DEFAULT_GESTURE_DIRECTION;
	const hasPanDirection = getPanGestureDirections(gestureDirection).length > 0;

	return {
		enabled: hasPanDirection,
		panActivationDirections: getPanActivationDirections({
			gestureDirection,
			hasSnapPoints,
		}),
		snapAxisDirections: getPanSnapAxisDirections(gestureDirection),
		gestureDrivesProgress:
			options.gestureDrivesProgress ?? DEFAULT_GESTURE_DRIVES_PROGRESS,
		gestureSensitivity:
			options.gestureSensitivity ?? DEFAULT_GESTURE_SENSITIVITY,
		gestureVelocityImpact:
			options.gestureVelocityImpact ?? DEFAULT_GESTURE_VELOCITY_IMPACT,
		gestureSnapVelocityImpact:
			options.gestureSnapVelocityImpact ?? DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
		gestureReleaseVelocityScale:
			options.gestureReleaseVelocityScale ??
			DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
		gestureReleaseVelocityMax:
			options.gestureReleaseVelocityMax ?? DEFAULT_GESTURE_RELEASE_VELOCITY_MAX,
		gestureActivationArea:
			options.gestureActivationArea ?? DEFAULT_GESTURE_ACTIVATION_AREA,
		gestureSnapLocked: options.gestureSnapLocked ?? DEFAULT_GESTURE_SNAP_LOCKED,
		sheetScrollGestureBehavior: resolveSheetScrollGestureBehavior(options),
		gestureResponseDistance: options.gestureResponseDistance,
		transitionSpec: options.transitionSpec,
	};
}

function resolvePinchPolicy(
	options: ScreenTransitionConfig,
	hasSnapPoints: boolean,
): PinchGesturePolicy {
	const gestureDirection =
		options.gestureDirection ?? DEFAULT_GESTURE_DIRECTION;
	const pinchDirections = getPinchGestureDirections(gestureDirection);
	const snapDirections = hasSnapPoints
		? getSnapPinchDirectionConfig(gestureDirection)
		: null;
	const pinchInEnabled = snapDirections
		? true
		: pinchDirections.includes("pinch-in");
	const pinchOutEnabled = snapDirections
		? true
		: pinchDirections.includes("pinch-out");

	return {
		enabled: pinchInEnabled || pinchOutEnabled,
		snapDirections,
		pinchInEnabled,
		pinchOutEnabled,
		gestureDrivesProgress:
			options.gestureDrivesProgress ?? DEFAULT_GESTURE_DRIVES_PROGRESS,
		gestureSensitivity:
			options.gestureSensitivity ?? DEFAULT_GESTURE_SENSITIVITY,
		gestureSnapVelocityImpact:
			options.gestureSnapVelocityImpact ?? DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
		gestureSnapLocked: options.gestureSnapLocked ?? DEFAULT_GESTURE_SNAP_LOCKED,
		gestureReleaseVelocityScale:
			options.gestureReleaseVelocityScale ??
			DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
		gestureReleaseVelocityMax:
			options.gestureReleaseVelocityMax ?? DEFAULT_GESTURE_RELEASE_VELOCITY_MAX,
		transitionSpec: options.transitionSpec,
	};
}

export function useScreenGestureConfig(): ScreenGestureConfig {
	const gestureContext = useGestureContext();
	const {
		current: { options },
	} = useDescriptors();

	const { isFirstKey } = useDescriptorDerivations();

	return useMemo(() => {
		const canDismiss = Boolean(isFirstKey ? false : options.gestureEnabled);
		// NOTE: The first screen still does not track gestures by default. Even if
		// gesture-driven animations are broadly available, initial-route gesture
		// animation should stay behind experimental_animateOnInitialMount until we
		// have feedback on whether that behavior is useful.
		const effectiveSnapPoints = validateSnapPoints({
			snapPoints: options.snapPoints,
			canDismiss,
		});
		const canTrackGesture = resolveCanTrackGesture({
			isFirstKey,
			canDismiss,
			hasSnapPoints: effectiveSnapPoints.hasSnapPoints,
			allowDisabledGestureTracking:
				options.experimental_allowDisabledGestureTracking,
		});
		const canClaimDirections = canTrackGesture;

		const claimedDirections = computeClaimedDirections(
			canClaimDirections,
			options.gestureDirection,
			effectiveSnapPoints.hasSnapPoints,
		);

		const participation: ScreenGestureParticipation = {
			canDismiss,
			canTrackGesture,
			effectiveSnapPoints,
			claimedDirections,
			ownershipStatus: resolveOwnership(claimedDirections, gestureContext),
		};

		return {
			participation,
			pan: resolvePanPolicy(options, effectiveSnapPoints.hasSnapPoints),
			pinch: resolvePinchPolicy(options, effectiveSnapPoints.hasSnapPoints),
		};
	}, [isFirstKey, options, gestureContext]);
}
