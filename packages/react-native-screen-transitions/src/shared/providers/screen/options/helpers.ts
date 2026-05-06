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
} from "../../../constants";
import type {
	ActivationArea,
	GestureActivationArea,
	GestureDirection,
	ScreenTransitionOptions,
	TransitionInterpolatedStyle,
} from "../../../types";
import type { BackdropBehavior } from "../../../types/screen.types";
import { resolveSheetScrollGestureBehavior } from "../../../utils/resolve-screen-transition-options";
import type {
	RequiredScreenOption,
	ScreenOptionsContextValue,
	ScreenOptionsSnapshot,
} from "./types";

const cloneGestureDirection = (
	direction: RequiredScreenOption<"gestureDirection">,
) => {
	"worklet";
	return Array.isArray(direction) ? [...direction] : direction;
};

const cloneGestureActivationArea = (
	activationArea: RequiredScreenOption<"gestureActivationArea">,
) => {
	"worklet";
	return typeof activationArea === "object" && activationArea !== null
		? { ...activationArea }
		: activationArea;
};

const resolveBooleanOption = <T extends boolean | undefined>(
	value: unknown,
	fallback: T,
): T => {
	"worklet";
	return typeof value === "boolean" ? (value as T) : fallback;
};

const resolveNumberOption = <T extends number | undefined>(
	value: unknown,
	fallback: T,
): T => {
	"worklet";
	return typeof value === "number" && Number.isFinite(value)
		? (value as T)
		: fallback;
};

const isGestureDirection = (value: unknown): value is GestureDirection => {
	"worklet";
	return (
		value === "horizontal" ||
		value === "horizontal-inverted" ||
		value === "vertical" ||
		value === "vertical-inverted" ||
		value === "bidirectional" ||
		value === "pinch-in" ||
		value === "pinch-out"
	);
};

const resolveGestureDirectionOption = (
	value: unknown,
	fallback: RequiredScreenOption<"gestureDirection">,
): RequiredScreenOption<"gestureDirection"> => {
	"worklet";
	if (isGestureDirection(value)) {
		return value;
	}
	if (Array.isArray(value) && value.every(isGestureDirection)) {
		return [...value];
	}
	return cloneGestureDirection(fallback);
};

const isActivationArea = (value: unknown): value is ActivationArea => {
	"worklet";
	return value === "edge" || value === "screen";
};

const resolveGestureActivationAreaOption = (
	value: unknown,
	fallback: RequiredScreenOption<"gestureActivationArea">,
): RequiredScreenOption<"gestureActivationArea"> => {
	"worklet";
	if (isActivationArea(value)) {
		return value;
	}
	if (typeof value === "object" && value !== null && !Array.isArray(value)) {
		const area = value as Record<string, unknown>;
		const isValid =
			(area.left === undefined || isActivationArea(area.left)) &&
			(area.right === undefined || isActivationArea(area.right)) &&
			(area.top === undefined || isActivationArea(area.top)) &&
			(area.bottom === undefined || isActivationArea(area.bottom));
		return isValid ? (area as GestureActivationArea) : fallback;
	}
	return cloneGestureActivationArea(fallback);
};

const resolveSheetScrollGestureBehaviorOption = (
	value: unknown,
	fallback: RequiredScreenOption<"sheetScrollGestureBehavior">,
): RequiredScreenOption<"sheetScrollGestureBehavior"> => {
	"worklet";
	return value === "expand-and-collapse" || value === "collapse-only"
		? value
		: fallback;
};

const resolveBackdropBehaviorOption = (
	value: unknown,
	fallback: BackdropBehavior | undefined,
): BackdropBehavior | undefined => {
	"worklet";
	return value === "block" ||
		value === "passthrough" ||
		value === "dismiss" ||
		value === "collapse"
		? value
		: fallback;
};

export const resolveBaseScreenOptions = (
	options: ScreenTransitionOptions,
): ScreenOptionsSnapshot => ({
	gestureEnabled: resolveBooleanOption(options.gestureEnabled, undefined),
	experimental_allowDisabledGestureTracking: resolveBooleanOption(
		options.experimental_allowDisabledGestureTracking,
		false,
	),
	gestureDirection: resolveGestureDirectionOption(
		options.gestureDirection,
		DEFAULT_GESTURE_DIRECTION,
	),
	gestureSensitivity: resolveNumberOption(
		options.gestureSensitivity,
		DEFAULT_GESTURE_SENSITIVITY,
	),
	gestureVelocityImpact: resolveNumberOption(
		options.gestureVelocityImpact,
		DEFAULT_GESTURE_VELOCITY_IMPACT,
	),
	gestureSnapVelocityImpact: resolveNumberOption(
		options.gestureSnapVelocityImpact,
		DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
	),
	gestureReleaseVelocityScale: resolveNumberOption(
		options.gestureReleaseVelocityScale,
		DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
	),
	gestureResponseDistance: resolveNumberOption(
		options.gestureResponseDistance,
		undefined,
	),
	gestureDrivesProgress: resolveBooleanOption(
		options.gestureDrivesProgress,
		DEFAULT_GESTURE_DRIVES_PROGRESS,
	),
	gestureActivationArea: resolveGestureActivationAreaOption(
		options.gestureActivationArea,
		DEFAULT_GESTURE_ACTIVATION_AREA,
	),
	gestureSnapLocked: resolveBooleanOption(
		options.gestureSnapLocked,
		DEFAULT_GESTURE_SNAP_LOCKED,
	),
	sheetScrollGestureBehavior: resolveSheetScrollGestureBehaviorOption(
		resolveSheetScrollGestureBehavior(options),
		DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR,
	),
	backdropBehavior: resolveBackdropBehaviorOption(
		options.backdropBehavior,
		undefined,
	),
});

export const syncScreenOptionsBase = (
	screenOptions: ScreenOptionsContextValue,
	base: ScreenOptionsSnapshot,
) => {
	"worklet";
	screenOptions.baseOptions.set(base);
	screenOptions.gestureEnabled.set(base.gestureEnabled);
	screenOptions.experimental_allowDisabledGestureTracking.set(
		base.experimental_allowDisabledGestureTracking,
	);
	screenOptions.gestureDirection.set(
		cloneGestureDirection(base.gestureDirection),
	);
	screenOptions.gestureSensitivity.set(base.gestureSensitivity);
	screenOptions.gestureVelocityImpact.set(base.gestureVelocityImpact);
	screenOptions.gestureSnapVelocityImpact.set(base.gestureSnapVelocityImpact);
	screenOptions.gestureReleaseVelocityScale.set(
		base.gestureReleaseVelocityScale,
	);
	screenOptions.gestureResponseDistance.set(base.gestureResponseDistance);
	screenOptions.gestureDrivesProgress.set(base.gestureDrivesProgress);
	screenOptions.gestureActivationArea.set(
		cloneGestureActivationArea(base.gestureActivationArea),
	);
	screenOptions.gestureSnapLocked.set(base.gestureSnapLocked);
	screenOptions.sheetScrollGestureBehavior.set(base.sheetScrollGestureBehavior);
	screenOptions.backdropBehavior.set(base.backdropBehavior);
};

export const syncScreenOptionsOverrides = (
	raw: TransitionInterpolatedStyle | undefined,
	screenOptions: ScreenOptionsContextValue,
) => {
	"worklet";
	const options = raw?.options;
	const base = screenOptions.baseOptions.get();

	screenOptions.gestureEnabled.set(
		resolveBooleanOption(options?.gestureEnabled, base.gestureEnabled),
	);
	screenOptions.experimental_allowDisabledGestureTracking.set(
		resolveBooleanOption(
			options?.experimental_allowDisabledGestureTracking,
			base.experimental_allowDisabledGestureTracking,
		),
	);
	screenOptions.gestureDirection.set(
		resolveGestureDirectionOption(
			options?.gestureDirection,
			base.gestureDirection,
		),
	);
	screenOptions.gestureSensitivity.set(
		resolveNumberOption(options?.gestureSensitivity, base.gestureSensitivity),
	);
	screenOptions.gestureVelocityImpact.set(
		resolveNumberOption(
			options?.gestureVelocityImpact,
			base.gestureVelocityImpact,
		),
	);
	screenOptions.gestureSnapVelocityImpact.set(
		resolveNumberOption(
			options?.gestureSnapVelocityImpact,
			base.gestureSnapVelocityImpact,
		),
	);
	screenOptions.gestureReleaseVelocityScale.set(
		resolveNumberOption(
			options?.gestureReleaseVelocityScale,
			base.gestureReleaseVelocityScale,
		),
	);
	screenOptions.gestureResponseDistance.set(
		resolveNumberOption(
			options?.gestureResponseDistance,
			base.gestureResponseDistance,
		),
	);
	screenOptions.gestureDrivesProgress.set(
		resolveBooleanOption(
			options?.gestureDrivesProgress,
			base.gestureDrivesProgress,
		),
	);
	screenOptions.gestureActivationArea.set(
		resolveGestureActivationAreaOption(
			options?.gestureActivationArea,
			base.gestureActivationArea,
		),
	);
	screenOptions.gestureSnapLocked.set(
		resolveBooleanOption(options?.gestureSnapLocked, base.gestureSnapLocked),
	);
	screenOptions.sheetScrollGestureBehavior.set(
		resolveSheetScrollGestureBehaviorOption(
			options?.sheetScrollGestureBehavior,
			base.sheetScrollGestureBehavior,
		),
	);
	screenOptions.backdropBehavior.set(
		resolveBackdropBehaviorOption(
			options?.backdropBehavior,
			base.backdropBehavior,
		),
	);
};
