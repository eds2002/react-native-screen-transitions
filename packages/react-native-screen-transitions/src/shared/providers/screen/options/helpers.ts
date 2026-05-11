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
	ScreenOptionsState,
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

const areGestureActivationAreasEqual = (
	left: RequiredScreenOption<"gestureActivationArea">,
	right: RequiredScreenOption<"gestureActivationArea">,
) => {
	"worklet";
	if (left === right) return true;

	if (
		typeof left !== "object" ||
		left === null ||
		typeof right !== "object" ||
		right === null
	) {
		return false;
	}

	return (
		left.left === right.left &&
		left.right === right.right &&
		left.top === right.top &&
		left.bottom === right.bottom
	);
};

const areGestureDirectionsEqual = (
	left: RequiredScreenOption<"gestureDirection">,
	right: RequiredScreenOption<"gestureDirection">,
) => {
	"worklet";
	if (left === right) return true;
	if (!Array.isArray(left) || !Array.isArray(right)) return false;
	if (left.length !== right.length) return false;

	for (let i = 0; i < left.length; i++) {
		if (left[i] !== right[i]) {
			return false;
		}
	}

	return true;
};

const areScreenOptionsEqual = (
	left: ScreenOptionsState,
	right: ScreenOptionsState,
) => {
	"worklet";
	return (
		left.gestureEnabled === right.gestureEnabled &&
		left.experimental_allowDisabledGestureTracking ===
			right.experimental_allowDisabledGestureTracking &&
		areGestureDirectionsEqual(left.gestureDirection, right.gestureDirection) &&
		left.gestureSensitivity === right.gestureSensitivity &&
		left.gestureVelocityImpact === right.gestureVelocityImpact &&
		left.gestureSnapVelocityImpact === right.gestureSnapVelocityImpact &&
		left.gestureReleaseVelocityScale === right.gestureReleaseVelocityScale &&
		left.gestureResponseDistance === right.gestureResponseDistance &&
		left.gestureDrivesProgress === right.gestureDrivesProgress &&
		areGestureActivationAreasEqual(
			left.gestureActivationArea,
			right.gestureActivationArea,
		) &&
		left.gestureSnapLocked === right.gestureSnapLocked &&
		left.sheetScrollGestureBehavior === right.sheetScrollGestureBehavior &&
		left.backdropBehavior === right.backdropBehavior &&
		left.baseOptions === right.baseOptions
	);
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
	const next = {
		...base,
		gestureDirection: cloneGestureDirection(base.gestureDirection),
		gestureActivationArea: cloneGestureActivationArea(
			base.gestureActivationArea,
		),
		baseOptions: base,
	};

	if (!areScreenOptionsEqual(screenOptions.get(), next)) {
		screenOptions.set(next);
	}
};

export const syncScreenOptionsOverrides = (
	raw: TransitionInterpolatedStyle | undefined,
	screenOptions: ScreenOptionsContextValue,
) => {
	"worklet";
	const options = raw?.options;
	const base = screenOptions.get().baseOptions;

	const next: ScreenOptionsState = {
		gestureEnabled: resolveBooleanOption(
			options?.gestureEnabled,
			base.gestureEnabled,
		),
		experimental_allowDisabledGestureTracking: resolveBooleanOption(
			options?.experimental_allowDisabledGestureTracking,
			base.experimental_allowDisabledGestureTracking,
		),
		gestureDirection: resolveGestureDirectionOption(
			options?.gestureDirection,
			base.gestureDirection,
		),
		gestureSensitivity: resolveNumberOption(
			options?.gestureSensitivity,
			base.gestureSensitivity,
		),
		gestureVelocityImpact: resolveNumberOption(
			options?.gestureVelocityImpact,
			base.gestureVelocityImpact,
		),
		gestureSnapVelocityImpact: resolveNumberOption(
			options?.gestureSnapVelocityImpact,
			base.gestureSnapVelocityImpact,
		),
		gestureReleaseVelocityScale: resolveNumberOption(
			options?.gestureReleaseVelocityScale,
			base.gestureReleaseVelocityScale,
		),
		gestureResponseDistance: resolveNumberOption(
			options?.gestureResponseDistance,
			base.gestureResponseDistance,
		),
		gestureDrivesProgress: resolveBooleanOption(
			options?.gestureDrivesProgress,
			base.gestureDrivesProgress,
		),
		gestureActivationArea: resolveGestureActivationAreaOption(
			options?.gestureActivationArea,
			base.gestureActivationArea,
		),
		gestureSnapLocked: resolveBooleanOption(
			options?.gestureSnapLocked,
			base.gestureSnapLocked,
		),
		sheetScrollGestureBehavior: resolveSheetScrollGestureBehaviorOption(
			options?.sheetScrollGestureBehavior,
			base.sheetScrollGestureBehavior,
		),
		backdropBehavior: resolveBackdropBehaviorOption(
			options?.backdropBehavior,
			base.backdropBehavior,
		),
		baseOptions: base,
	};

	if (!areScreenOptionsEqual(screenOptions.get(), next)) {
		screenOptions.set(next);
	}
};
