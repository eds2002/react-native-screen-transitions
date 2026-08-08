import type { ScreenTransitionConfig } from "../../types";

type NativeStackTransitionResetOptions = {
	presentation: "containedTransparentModal";
	animation: "none";
	headerShown: false;
	gestureEnabled: false;
};

export type AdapterDescriptorOptions = ScreenTransitionConfig & {
	enableTransitions?: boolean;
};

export type NativeStackAdapterOptions<
	TNativeOptions extends object = Record<string, unknown>,
> = Omit<TNativeOptions, keyof AdapterDescriptorOptions> &
	AdapterDescriptorOptions;

const NATIVE_STACK_TRANSITION_RESET_OPTIONS: NativeStackTransitionResetOptions =
	{
		presentation: "containedTransparentModal",
		animation: "none",
		headerShown: false,
		gestureEnabled: false,
	};

const ADAPTER_GESTURE_ENABLED_RESTORE = Symbol(
	"react-native-screen-transitions.adapterGestureEnabledRestore",
);
const ADAPTER_GESTURE_DIRECTION_RESTORE = Symbol(
	"react-native-screen-transitions.adapterGestureDirectionRestore",
);
const ADAPTER_GESTURE_RESPONSE_DISTANCE_RESTORE = Symbol(
	"react-native-screen-transitions.adapterGestureResponseDistanceRestore",
);

type OptionsWithTransitionRestore = Record<string, unknown> & {
	[ADAPTER_GESTURE_ENABLED_RESTORE]?: ScreenTransitionConfig["gestureEnabled"];
	[ADAPTER_GESTURE_DIRECTION_RESTORE]?: ScreenTransitionConfig["gestureDirection"];
	[ADAPTER_GESTURE_RESPONSE_DISTANCE_RESTORE]?: ScreenTransitionConfig["gestureResponseDistance"];
};

export type NativeStackAdapterOptionInput =
	| Record<string, unknown>
	| ((...args: any[]) => Record<string, unknown> | undefined);

function isPlainOptions(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function hasOwnOption(value: object, key: PropertyKey): boolean {
	return Object.getOwnPropertyDescriptor(value, key) !== undefined;
}

export function adaptNativeStackTransitionOptions<
	TOptions extends NativeStackAdapterOptionInput | undefined,
>(options: TOptions): TOptions {
	if (typeof options === "function") {
		return ((...args: any[]) =>
			adaptNativeStackTransitionOptions(options(...args))) as TOptions;
	}

	if (!isPlainOptions(options)) {
		return options;
	}

	const hasTransitionsEnabled = options.enableTransitions === true;

	if (!hasTransitionsEnabled) {
		return options;
	}

	const nativeOptions = options as Record<string, unknown>;
	const adaptedOptions: Record<string, unknown> = {
		...nativeOptions,
		...NATIVE_STACK_TRANSITION_RESET_OPTIONS,
		enableTransitions: true,
	};

	delete adaptedOptions.gestureDirection;
	delete adaptedOptions.gestureResponseDistance;

	if (hasOwnOption(nativeOptions, "gestureEnabled")) {
		(adaptedOptions as OptionsWithTransitionRestore)[
			ADAPTER_GESTURE_ENABLED_RESTORE
		] =
			nativeOptions.gestureEnabled as ScreenTransitionConfig["gestureEnabled"];
	}

	if (hasOwnOption(nativeOptions, "gestureDirection")) {
		(adaptedOptions as OptionsWithTransitionRestore)[
			ADAPTER_GESTURE_DIRECTION_RESTORE
		] =
			nativeOptions.gestureDirection as ScreenTransitionConfig["gestureDirection"];
	}

	if (hasOwnOption(nativeOptions, "gestureResponseDistance")) {
		(adaptedOptions as OptionsWithTransitionRestore)[
			ADAPTER_GESTURE_RESPONSE_DISTANCE_RESTORE
		] =
			nativeOptions.gestureResponseDistance as ScreenTransitionConfig["gestureResponseDistance"];
	}

	return adaptedOptions as TOptions;
}

export function resolveAdapterTransitionOptions<
	TOptions extends AdapterDescriptorOptions,
>(options: TOptions): TOptions & ScreenTransitionConfig {
	const optionRecord = options as OptionsWithTransitionRestore;
	const hasGestureEnabledRestore = hasOwnOption(
		optionRecord,
		ADAPTER_GESTURE_ENABLED_RESTORE,
	);
	const hasGestureDirectionRestore = hasOwnOption(
		optionRecord,
		ADAPTER_GESTURE_DIRECTION_RESTORE,
	);
	const hasGestureResponseDistanceRestore = hasOwnOption(
		optionRecord,
		ADAPTER_GESTURE_RESPONSE_DISTANCE_RESTORE,
	);

	if (
		!hasGestureEnabledRestore &&
		!hasGestureDirectionRestore &&
		!hasGestureResponseDistanceRestore
	) {
		return options;
	}

	const resolvedOptions = {
		...options,
		enableTransitions: true,
	};
	delete (resolvedOptions as OptionsWithTransitionRestore)[
		ADAPTER_GESTURE_ENABLED_RESTORE
	];
	delete (resolvedOptions as OptionsWithTransitionRestore)[
		ADAPTER_GESTURE_DIRECTION_RESTORE
	];
	delete (resolvedOptions as OptionsWithTransitionRestore)[
		ADAPTER_GESTURE_RESPONSE_DISTANCE_RESTORE
	];

	if (hasGestureEnabledRestore) {
		resolvedOptions.gestureEnabled =
			optionRecord[ADAPTER_GESTURE_ENABLED_RESTORE];
	} else {
		delete resolvedOptions.gestureEnabled;
	}

	if (hasGestureDirectionRestore) {
		resolvedOptions.gestureDirection =
			optionRecord[ADAPTER_GESTURE_DIRECTION_RESTORE];
	} else {
		delete resolvedOptions.gestureDirection;
	}

	if (hasGestureResponseDistanceRestore) {
		resolvedOptions.gestureResponseDistance =
			optionRecord[ADAPTER_GESTURE_RESPONSE_DISTANCE_RESTORE];
	} else {
		delete resolvedOptions.gestureResponseDistance;
	}

	return resolvedOptions;
}
