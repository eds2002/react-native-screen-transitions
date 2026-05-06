import type { ScreenOptionsContextValue } from "../../options";
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

export const resolveRuntimeCanTrackGesture = (
	runtime: PanGestureRuntime | PinchGestureRuntime,
	screenOptions: ScreenOptionsContextValue,
) => {
	"worklet";
	const { participation } = runtime;

	if (participation.isFirstKey) {
		return false;
	}

	if (screenOptions.experimental_allowDisabledGestureTracking.get() === true) {
		return true;
	}

	const gestureEnabled = screenOptions.gestureEnabled.get();
	if (gestureEnabled === true) {
		return true;
	}

	if (gestureEnabled === false) {
		return participation.effectiveSnapPoints.hasSnapPoints;
	}

	return participation.canTrackGesture;
};

export const resolveRuntimeCanDismiss = (
	runtime: PanGestureRuntime | PinchGestureRuntime,
	screenOptions: ScreenOptionsContextValue,
) => {
	"worklet";
	const { participation } = runtime;

	if (participation.isFirstKey) {
		return false;
	}

	const gestureEnabled = screenOptions.gestureEnabled.get();
	if (gestureEnabled === false) {
		return false;
	}

	if (gestureEnabled === true) {
		return true;
	}

	return participation.canDismiss;
};

export const resolvePanRuntimePolicy = (
	runtime: PanGestureRuntime,
	screenOptions: ScreenOptionsContextValue,
): PanGesturePolicy => {
	"worklet";
	const { policy, participation } = runtime;
	const gestureDirection = screenOptions.gestureDirection.get();
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
		gestureDrivesProgress: screenOptions.gestureDrivesProgress.get(),
		gestureSensitivity: screenOptions.gestureSensitivity.get(),
		gestureVelocityImpact: screenOptions.gestureVelocityImpact.get(),
		gestureSnapVelocityImpact: screenOptions.gestureSnapVelocityImpact.get(),
		gestureReleaseVelocityScale:
			screenOptions.gestureReleaseVelocityScale.get(),
		gestureResponseDistance: screenOptions.gestureResponseDistance.get(),
		gestureActivationArea: screenOptions.gestureActivationArea.get(),
		gestureSnapLocked: screenOptions.gestureSnapLocked.get(),
		sheetScrollGestureBehavior: screenOptions.sheetScrollGestureBehavior.get(),
	};
};

export const resolvePinchRuntimePolicy = (
	runtime: PinchGestureRuntime,
	screenOptions: ScreenOptionsContextValue,
): PinchGesturePolicy => {
	"worklet";
	const { policy, participation } = runtime;
	const gestureDirection = screenOptions.gestureDirection.get();
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
		gestureDrivesProgress: screenOptions.gestureDrivesProgress.get(),
		gestureSensitivity: screenOptions.gestureSensitivity.get(),
		gestureSnapVelocityImpact: screenOptions.gestureSnapVelocityImpact.get(),
		gestureReleaseVelocityScale:
			screenOptions.gestureReleaseVelocityScale.get(),
		gestureSnapLocked: screenOptions.gestureSnapLocked.get(),
	};
};

export const resolvePanRuntime = (
	runtime: PanGestureRuntime,
	screenOptions: ScreenOptionsContextValue,
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
	screenOptions: ScreenOptionsContextValue,
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
