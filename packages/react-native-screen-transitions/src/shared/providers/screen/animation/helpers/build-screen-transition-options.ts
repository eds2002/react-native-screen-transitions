import type {
	ScreenTransitionConfig,
	ScreenTransitionOptions,
} from "../../../../types";
import { resolveSheetScrollGestureBehavior } from "../../../../utils/resolve-screen-transition-options";

export const buildScreenTransitionOptions = (
	options: ScreenTransitionConfig,
): ScreenTransitionOptions => {
	const hasSheetScrollGestureBehavior =
		options.sheetScrollGestureBehavior !== undefined ||
		options.expandViaScrollView !== undefined;

	return {
		navigationMaskEnabled: options.navigationMaskEnabled,
		gestureEnabled: options.gestureEnabled,
		gestureTracking: options.gestureTracking,
		gestureDirection: options.gestureDirection,
		gestureSensitivity: options.gestureSensitivity,
		gestureVelocityImpact: options.gestureVelocityImpact,
		gestureSnapVelocityImpact: options.gestureSnapVelocityImpact,
		gestureReleaseVelocityScale: options.gestureReleaseVelocityScale,
		gestureResponseDistance: options.gestureResponseDistance,
		gestureProgressMode: options.gestureProgressMode,
		gestureDrivesProgress: options.gestureDrivesProgress,
		gestureActivationArea: options.gestureActivationArea,
		gestureSnapLocked: options.gestureSnapLocked,
		sheetScrollGestureBehavior: hasSheetScrollGestureBehavior
			? resolveSheetScrollGestureBehavior(options)
			: undefined,
		backdropBehavior: options.backdropBehavior,
	};
};
