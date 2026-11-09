import {
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
	DEFAULT_GESTURE_SENSITIVITY,
	DEFAULT_GESTURE_SNAP_LOCKED,
	DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
	DEFAULT_GESTURE_TRACKING,
	DEFAULT_GESTURE_VELOCITY_IMPACT,
	DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR,
	DEFAULT_SHEET_SNAP_BEHAVIOR,
} from "../../../constants";
import type {
	GestureDirection,
	GestureDirectionActivationArea,
	GestureDirectionEntry,
	ScreenTransitionConfig,
	TransitionInterpolatedStyle,
} from "../../../types";
import type { BackdropBehavior } from "../../../types/screen.types";
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

const resolveSheetScrollGestureBehaviorOption = (
	value: unknown,
	fallback: RequiredScreenOption<"sheetScrollGestureBehavior">,
): RequiredScreenOption<"sheetScrollGestureBehavior"> => {
	"worklet";
	return value === "expand-and-collapse" || value === "collapse-only"
		? value
		: fallback;
};

const resolveSheetSnapBehaviorOption = (
	value: unknown,
	fallback: RequiredScreenOption<"sheetSnapBehavior">,
): RequiredScreenOption<"sheetSnapBehavior"> => {
	"worklet";
	return value === "continuous" || value === "step" ? value : fallback;
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

type ScreenOptionKey = keyof ScreenOptionsSnapshot;

type ScreenOptionSpec<K extends ScreenOptionKey> = {
	/** The value validated; `fallback` when it isn't a valid value for the option. */
	resolve: (
		value: unknown,
		fallback: ScreenOptionsSnapshot[K],
	) => ScreenOptionsSnapshot[K];
	/** Its value when a screen doesn't set it (or sets an invalid one). */
	fallback: ScreenOptionsSnapshot[K];
	/** Whether an interpolator's returned `options` can override it for a frame. */
	overridable: boolean;
	/** How two states compare it, when not by identity. */
	equal?: (
		left: ScreenOptionsSnapshot[K],
		right: ScreenOptionsSnapshot[K],
	) => boolean;
};

/**
 * Every screen option the motion layer reads, with how it is validated, defaulted and overridden.
 * Typed against ScreenOptionsSnapshot: an option added there needs its entry here, and the base
 * options, the interpolator overrides and the comparisons below all follow from this table.
 */
const SCREEN_OPTIONS: { [K in ScreenOptionKey]: ScreenOptionSpec<K> } = {
	gestureEnabled: {
		resolve: resolveBooleanOption,
		fallback: undefined,
		overridable: true,
	},
	gestureTracking: {
		resolve: resolveGestureTrackingOption,
		fallback: DEFAULT_GESTURE_TRACKING,
		overridable: false,
	},
	gestureDirection: {
		resolve: resolveGestureDirectionOption,
		fallback: DEFAULT_GESTURE_DIRECTION,
		overridable: true,
		equal: areGestureDirectionsEqual,
	},
	gestureSensitivity: {
		resolve: resolveNumberOption,
		fallback: DEFAULT_GESTURE_SENSITIVITY,
		overridable: true,
	},
	gestureVelocityImpact: {
		resolve: resolveNumberOption,
		fallback: DEFAULT_GESTURE_VELOCITY_IMPACT,
		overridable: true,
	},
	gestureSnapVelocityImpact: {
		resolve: resolveNumberOption,
		fallback: DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
		overridable: true,
	},
	gestureReleaseVelocityScale: {
		resolve: resolveNumberOption,
		fallback: DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
		overridable: true,
	},
	gestureSnapLocked: {
		resolve: resolveBooleanOption,
		fallback: DEFAULT_GESTURE_SNAP_LOCKED,
		overridable: true,
	},
	sheetSnapBehavior: {
		resolve: resolveSheetSnapBehaviorOption,
		fallback: DEFAULT_SHEET_SNAP_BEHAVIOR,
		overridable: true,
	},
	sheetScrollGestureBehavior: {
		resolve: resolveSheetScrollGestureBehaviorOption,
		fallback: DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR,
		overridable: true,
	},
	backdropBehavior: {
		resolve: resolveBackdropBehaviorOption,
		fallback: undefined,
		overridable: true,
	},
	transitionSpec: {
		resolve: (value) => {
			"worklet";
			return value as ScreenOptionsSnapshot["transitionSpec"];
		},
		fallback: undefined,
		overridable: false,
	},
};

const SCREEN_OPTION_KEYS = Object.keys(SCREEN_OPTIONS) as ScreenOptionKey[];

/** Read and written key by key: the table above gives each key its own value type. */
type ScreenOptionValues = Record<ScreenOptionKey, unknown>;
type AnyScreenOptionSpec = {
	resolve: (value: unknown, fallback: unknown) => unknown;
	fallback: unknown;
	overridable: boolean;
	equal?: (left: unknown, right: unknown) => boolean;
};
const specOf = (key: ScreenOptionKey) => {
	"worklet";
	return SCREEN_OPTIONS[key] as AnyScreenOptionSpec;
};

const areScreenOptionsEqual = (
	left: ScreenOptionsState,
	right: ScreenOptionsState,
) => {
	"worklet";
	if (left.baseOptions !== right.baseOptions) return false;
	const a = left as ScreenOptionValues;
	const b = right as ScreenOptionValues;
	for (let i = 0; i < SCREEN_OPTION_KEYS.length; i++) {
		const key = SCREEN_OPTION_KEYS[i];
		const equal = specOf(key).equal;
		if (equal ? !equal(a[key], b[key]) : a[key] !== b[key]) return false;
	}
	return true;
};

export const resolveBaseScreenOptions = (
	options: ScreenTransitionConfig,
): ScreenOptionsSnapshot => {
	const input = options as Partial<ScreenOptionValues>;
	const base = {} as ScreenOptionValues;
	for (const key of SCREEN_OPTION_KEYS) {
		const spec = specOf(key);
		base[key] = spec.resolve(input[key], spec.fallback);
	}
	return base as ScreenOptionsSnapshot;
};

/** The options a screen reads, in table order: a dependency list for the base options' memo. */
export const screenOptionInputs = (options: ScreenTransitionConfig) =>
	SCREEN_OPTION_KEYS.map((key) => options[key]);

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

const isStateEqualToBase = (
	state: ScreenOptionsState,
	base: ScreenOptionsSnapshot,
) => {
	"worklet";
	const a = state as ScreenOptionValues;
	const b = base as ScreenOptionValues;
	for (let i = 0; i < SCREEN_OPTION_KEYS.length; i++) {
		const key = SCREEN_OPTION_KEYS[i];
		if (a[key] !== b[key]) return false;
	}
	return true;
};

export const syncScreenOptionsOverrides = (
	raw: TransitionInterpolatedStyle | undefined,
	screenOptions: ScreenOptionsContextValue,
) => {
	"worklet";
	const options = raw?.options as Partial<ScreenOptionValues> | undefined;
	const current = screenOptions.get();
	const base = current.baseOptions;

	// Most interpolators return no `options`; every resolver below then yields
	// the base value, so a state already equal to the base needs no rebuild.
	if (options === undefined && isStateEqualToBase(current, base)) {
		return;
	}

	const values = base as ScreenOptionValues;
	const next = { baseOptions: base } as ScreenOptionValues & {
		baseOptions: ScreenOptionsSnapshot;
	};
	for (let i = 0; i < SCREEN_OPTION_KEYS.length; i++) {
		const key = SCREEN_OPTION_KEYS[i];
		const spec = specOf(key);
		next[key] = spec.overridable
			? spec.resolve(options?.[key], values[key])
			: values[key];
	}

	if (!areScreenOptionsEqual(current, next as ScreenOptionsState)) {
		screenOptions.set(next as ScreenOptionsState);
	}
};
