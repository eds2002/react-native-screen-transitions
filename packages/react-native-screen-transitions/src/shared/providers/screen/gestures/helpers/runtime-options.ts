import type { ScreenOptionsSnapshot } from "../../options";
import type {
	PanGesturePolicy,
	PanGestureRuntime,
	PinchGesturePolicy,
	PinchGestureRuntime,
} from "../types";
import {
	getPanActivationDirections,
	getPanGestureDirections,
	getPanSnapAxisDirections,
	getPinchGestureDirections,
	getSnapPinchDirectionConfig,
} from "./gesture-directions";

const resolveRuntimeCanTrackGesture = (
	runtime: PanGestureRuntime | PinchGestureRuntime,
	screenOptions: ScreenOptionsSnapshot,
) => {
	"worklet";
	const { participation } = runtime;

	if (participation.isFirstKey) {
		return false;
	}

	if (screenOptions.experimental_allowDisabledGestureTracking === true) {
		return true;
	}

	const gestureEnabled = screenOptions.gestureEnabled;
	if (gestureEnabled === true) {
		return true;
	}

	if (gestureEnabled === false) {
		return participation.effectiveSnapPoints.hasSnapPoints;
	}

	return participation.canTrackGesture;
};

const resolveRuntimeCanDismiss = (
	runtime: PanGestureRuntime | PinchGestureRuntime,
	screenOptions: ScreenOptionsSnapshot,
) => {
	"worklet";
	const { participation } = runtime;

	if (participation.isFirstKey) {
		return false;
	}

	const gestureEnabled = screenOptions.gestureEnabled;
	if (gestureEnabled === false) {
		return false;
	}

	if (gestureEnabled === true) {
		return true;
	}

	return participation.canDismiss;
};

const resolvePanRuntimePolicy = (
	runtime: PanGestureRuntime,
	screenOptions: ScreenOptionsSnapshot,
): PanGesturePolicy => {
	"worklet";
	const { policy, participation } = runtime;
	const gestureDirection = screenOptions.gestureDirection;
	const hasSnapPoints = participation.effectiveSnapPoints.hasSnapPoints;

	return {
		...policy,
		enabled: getPanGestureDirections(gestureDirection).length > 0,
		gestureDirection,
		panActivationDirections: getPanActivationDirections({
			gestureDirection,
			hasSnapPoints,
		}),
		snapAxisDirections: getPanSnapAxisDirections(gestureDirection),
		gestureDrivesProgress: screenOptions.gestureDrivesProgress,
		gestureSensitivity: screenOptions.gestureSensitivity,
		gestureVelocityImpact: screenOptions.gestureVelocityImpact,
		gestureSnapVelocityImpact: screenOptions.gestureSnapVelocityImpact,
		gestureReleaseVelocityScale: screenOptions.gestureReleaseVelocityScale,
		gestureResponseDistance: screenOptions.gestureResponseDistance,
		gestureActivationArea: screenOptions.gestureActivationArea,
		gestureSnapLocked: screenOptions.gestureSnapLocked,
		sheetScrollGestureBehavior: screenOptions.sheetScrollGestureBehavior,
	};
};

const resolvePinchRuntimePolicy = (
	runtime: PinchGestureRuntime,
	screenOptions: ScreenOptionsSnapshot,
): PinchGesturePolicy => {
	"worklet";
	const { policy, participation } = runtime;
	const gestureDirection = screenOptions.gestureDirection;
	const pinchDirections = getPinchGestureDirections(gestureDirection);
	const snapDirections = participation.effectiveSnapPoints.hasSnapPoints
		? getSnapPinchDirectionConfig(gestureDirection)
		: null;
	const pinchInEnabled = snapDirections
		? true
		: pinchDirections.includes("pinch-in");
	const pinchOutEnabled = snapDirections
		? true
		: pinchDirections.includes("pinch-out");

	return {
		...policy,
		enabled: pinchInEnabled || pinchOutEnabled,
		gestureDirection,
		snapDirections,
		pinchInEnabled,
		pinchOutEnabled,
		gestureDrivesProgress: screenOptions.gestureDrivesProgress,
		gestureSensitivity: screenOptions.gestureSensitivity,
		gestureSnapVelocityImpact: screenOptions.gestureSnapVelocityImpact,
		gestureReleaseVelocityScale: screenOptions.gestureReleaseVelocityScale,
		gestureSnapLocked: screenOptions.gestureSnapLocked,
	};
};

export const resolvePanRuntime = (
	runtime: PanGestureRuntime,
	screenOptions: ScreenOptionsSnapshot,
): PanGestureRuntime => {
	"worklet";
	return {
		...runtime,
		participation: {
			...runtime.participation,
			canDismiss: resolveRuntimeCanDismiss(runtime, screenOptions),
			canTrackGesture: resolveRuntimeCanTrackGesture(runtime, screenOptions),
		},
		policy: resolvePanRuntimePolicy(runtime, screenOptions),
	};
};

export const resolvePinchRuntime = (
	runtime: PinchGestureRuntime,
	screenOptions: ScreenOptionsSnapshot,
): PinchGestureRuntime => {
	"worklet";
	return {
		...runtime,
		participation: {
			...runtime.participation,
			canDismiss: resolveRuntimeCanDismiss(runtime, screenOptions),
			canTrackGesture: resolveRuntimeCanTrackGesture(runtime, screenOptions),
		},
		policy: resolvePinchRuntimePolicy(runtime, screenOptions),
	};
};
