import type {
	ScreenTransitionConfig,
	ScreenTransitionOptions,
} from "../../../../types";
import {
	gestureProgressModeDrivesProgress,
	resolveGestureProgressMode,
} from "../../../../utils/gesture-progress-mode";
import { resolveSheetScrollGestureBehavior } from "../../../../utils/resolve-screen-transition-options";

export const buildScreenTransitionOptions = (
	options: ScreenTransitionConfig,
): ScreenTransitionOptions => {
	const hasSheetScrollGestureBehavior =
		options.sheetScrollGestureBehavior !== undefined ||
		options.expandViaScrollView !== undefined;
	const hasGestureProgressMode =
		options.gestureProgressMode !== undefined ||
		options.gestureDrivesProgress !== undefined;
	const gestureProgressMode = hasGestureProgressMode
		? resolveGestureProgressMode({
				gestureProgressMode: options.gestureProgressMode,
				gestureDrivesProgress: options.gestureDrivesProgress,
			})
		: undefined;

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
		gestureProgressMode,
		gestureDrivesProgress: gestureProgressMode
			? gestureProgressModeDrivesProgress(gestureProgressMode)
			: undefined,
		gestureActivationArea: options.gestureActivationArea,
		gestureSnapLocked: options.gestureSnapLocked,
		sheetScrollGestureBehavior: hasSheetScrollGestureBehavior
			? resolveSheetScrollGestureBehavior(options)
			: undefined,
		backdropBehavior: options.backdropBehavior,
	};
};
