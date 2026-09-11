import type {
	ScreenTransitionConfig,
	ScreenTransitionOptions,
} from "../../../../../types";

export const buildScreenTransitionOptions = (
	options: ScreenTransitionConfig,
): ScreenTransitionOptions => {
	return {
		gestureEnabled: options.gestureEnabled,
		gestureTracking: options.gestureTracking,
		gestureDirection: options.gestureDirection,
		gestureSensitivity: options.gestureSensitivity,
		gestureVelocityImpact: options.gestureVelocityImpact,
		gestureSnapVelocityImpact: options.gestureSnapVelocityImpact,
		gestureReleaseVelocityScale: options.gestureReleaseVelocityScale,
		gestureSnapLocked: options.gestureSnapLocked,
		sheetSnapBehavior: options.sheetSnapBehavior,
		sheetScrollGestureBehavior: options.sheetScrollGestureBehavior,
		backdropBehavior: options.backdropBehavior,
	};
};
