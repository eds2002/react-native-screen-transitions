import {
	DEFAULT_GESTURE_ACTIVATION_AREA,
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
	DEFAULT_GESTURE_SENSITIVITY,
	DEFAULT_GESTURE_SNAP_LOCKED,
	DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
	DEFAULT_GESTURE_TRACKING,
	DEFAULT_GESTURE_VELOCITY_IMPACT,
	DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR,
} from "../../../constants";
import type {
	ActivationArea,
	GestureActivationArea,
	GestureDirection,
	GestureDirectionActivationArea,
	GestureDirectionEntry,
	ScreenTransitionConfig,
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

const isGestureDirectionActivationArea = (
	value: unknown,
): value is GestureDirectionActivationArea => {
	"worklet";
	return (
		value === "edge" ||
		value === "screen" ||
		(typeof value === "number" && Number.isFinite(value) && value >= 0)
	);
};

const isGestureDirectionEntry = (
	value: unknown,
): value is GestureDirectionEntry => {
	"worklet";
	if (isGestureDirection(value)) {
		return true;
	}

	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return false;
	}

	const config = value as Record<string, unknown>;
	return (
		isGestureDirection(config.gesture) &&
		(config.area === undefined || isGestureDirectionActivationArea(config.area))
	);
};

const cloneGestureDirectionEntry = (
	entry: GestureDirectionEntry,
): GestureDirectionEntry => {
	"worklet";
	if (typeof entry === "string") {
		return entry;
	}

	return entry.area === undefined
		? { gesture: entry.gesture }
		: { gesture: entry.gesture, area: entry.area };
};

const resolveGestureDirectionOption = (
	value: unknown,
	fallback: RequiredScreenOption<"gestureDirection">,
): RequiredScreenOption<"gestureDirection"> => {
	"worklet";
	if (isGestureDirectionEntry(value)) {
		return cloneGestureDirectionEntry(value);
	}
	if (Array.isArray(value)) {
		const entries: GestureDirectionEntry[] = [];
		for (const entry of value) {
			if (!isGestureDirectionEntry(entry)) {
				return fallback;
			}
			entries.push(cloneGestureDirectionEntry(entry));
		}
		return entries;
	}
	return fallback;
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
	return fallback;
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

const resolveGestureTrackingOption = (
	value: unknown,
	fallback: RequiredScreenOption<"gestureTracking">,
): RequiredScreenOption<"gestureTracking"> => {
	"worklet";
	return value === "auto" || value === "never" || value === "always"
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

const areGestureDirectionEntriesEqual = (
	left: GestureDirectionEntry,
	right: GestureDirectionEntry,
) => {
	"worklet";
	if (left === right) return true;

	if (typeof left === "string" || typeof right === "string") {
		return false;
	}

	return left.gesture === right.gesture && left.area === right.area;
};

const areGestureDirectionsEqual = (
	left: RequiredScreenOption<"gestureDirection">,
	right: RequiredScreenOption<"gestureDirection">,
) => {
	"worklet";
	if (
		!Array.isArray(left) &&
		!Array.isArray(right) &&
		areGestureDirectionEntriesEqual(left, right)
	) {
		return true;
	}
	if (!Array.isArray(left) || !Array.isArray(right)) return false;
	if (left.length !== right.length) return false;

	for (let i = 0; i < left.length; i++) {
		if (!areGestureDirectionEntriesEqual(left[i], right[i])) {
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
		left.navigationMaskEnabled === right.navigationMaskEnabled &&
		left.gestureEnabled === right.gestureEnabled &&
		left.gestureTracking === right.gestureTracking &&
		areGestureDirectionsEqual(left.gestureDirection, right.gestureDirection) &&
		left.gestureSensitivity === right.gestureSensitivity &&
		left.gestureVelocityImpact === right.gestureVelocityImpact &&
		left.gestureSnapVelocityImpact === right.gestureSnapVelocityImpact &&
		left.gestureReleaseVelocityScale === right.gestureReleaseVelocityScale &&
		left.gestureResponseDistance === right.gestureResponseDistance &&
		areGestureActivationAreasEqual(
			left.gestureActivationArea,
			right.gestureActivationArea,
		) &&
		left.gestureSnapLocked === right.gestureSnapLocked &&
		left.sheetScrollGestureBehavior === right.sheetScrollGestureBehavior &&
		left.backdropBehavior === right.backdropBehavior &&
		left.transitionSpec === right.transitionSpec &&
		left.baseOptions === right.baseOptions
	);
};

export const resolveBaseScreenOptions = (
	options: ScreenTransitionConfig,
): ScreenOptionsSnapshot => {
	return {
		navigationMaskEnabled: resolveBooleanOption(
			options.navigationMaskEnabled,
			undefined,
		),
		gestureEnabled: resolveBooleanOption(options.gestureEnabled, undefined),
		gestureTracking: resolveGestureTrackingOption(
			options.gestureTracking,
			DEFAULT_GESTURE_TRACKING,
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
		transitionSpec: options.transitionSpec,
	};
};

export const syncScreenOptionsBase = (
	screenOptions: ScreenOptionsContextValue,
	base: ScreenOptionsSnapshot,
) => {
	"worklet";
	const next = {
		...base,
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
		navigationMaskEnabled: base.navigationMaskEnabled,
		gestureEnabled: resolveBooleanOption(
			options?.gestureEnabled,
			base.gestureEnabled,
		),
		gestureTracking: base.gestureTracking,
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
		transitionSpec: base.transitionSpec,
		baseOptions: base,
	};

	if (!areScreenOptionsEqual(screenOptions.get(), next)) {
		screenOptions.set(next);
	}
};
