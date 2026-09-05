import type {
	ScreenTransitionConfig,
	ScreenTransitionOptions,
} from "../../../../../types";
import { resolveSheetScrollGestureBehavior } from "../../../../../utils/resolve-screen-transition-options";

export const buildScreenTransitionOptions = (
	options: ScreenTransitionConfig,
): ScreenTransitionOptions => {
	return {
		navigationMaskEnabled: options.navigationMaskEnabled,
		gestureEnabled: options.gestureEnabled,
		gestureTracking: options.gestureTracking,
		gestureDirection: options.gestureDirection,
		gestureSensitivity: options.gestureSensitivity,
		gestureVelocityImpact: options.gestureVelocityImpact,
		gestureSnapVelocityImpact: options.gestureSnapVelocityImpact,
		gestureReleaseVelocityScale: options.gestureReleaseVelocityScale,
		gestureSnapLocked: options.gestureSnapLocked,
		sheetSnapBehavior: options.sheetSnapBehavior,
		sheetScrollGestureBehavior:
			options.sheetScrollGestureBehavior !== undefined
				? resolveSheetScrollGestureBehavior(options)
				: undefined,
		backdropBehavior: options.backdropBehavior,
	};
};
