import type {
	GestureActivationArea,
	GestureDirection,
	ScreenTransitionConfig,
	ScreenTransitionOptions,
} from "../../../../types";
import {
	gestureProgressModeDrivesProgress,
	resolveGestureProgressMode,
} from "../../../../utils/gesture-progress-mode";
import { resolveSheetScrollGestureBehavior } from "../../../../utils/resolve-screen-transition-options";

const cloneGestureDirection = (
	direction: GestureDirection | GestureDirection[] | undefined,
) => (Array.isArray(direction) ? [...direction] : direction);

const cloneGestureActivationArea = (
	activationArea: GestureActivationArea | undefined,
) =>
	typeof activationArea === "object" && activationArea !== null
		? { ...activationArea }
		: activationArea;

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
		gestureEnabled: options.gestureEnabled,
		experimental_allowDisabledGestureTracking:
			options.experimental_allowDisabledGestureTracking,
		gestureDirection: cloneGestureDirection(options.gestureDirection),
		gestureSensitivity: options.gestureSensitivity,
		gestureVelocityImpact: options.gestureVelocityImpact,
		gestureSnapVelocityImpact: options.gestureSnapVelocityImpact,
		gestureReleaseVelocityScale: options.gestureReleaseVelocityScale,
		gestureResponseDistance: options.gestureResponseDistance,
		gestureProgressMode,
		gestureDrivesProgress: gestureProgressMode
			? gestureProgressModeDrivesProgress(gestureProgressMode)
			: undefined,
		gestureActivationArea: cloneGestureActivationArea(
			options.gestureActivationArea,
		),
		gestureSnapLocked: options.gestureSnapLocked,
		sheetScrollGestureBehavior: hasSheetScrollGestureBehavior
			? resolveSheetScrollGestureBehavior(options)
			: undefined,
		backdropBehavior: options.backdropBehavior,
	};
};
