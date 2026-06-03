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

type GestureEnabledRestore = {
	gestureEnabled: ScreenTransitionConfig["gestureEnabled"];
	hasGestureEnabled: boolean;
};

const gestureEnabledRestoreByAdaptedOptions = new WeakMap<
	Record<string, unknown>,
	GestureEnabledRestore
>();

export type NativeStackAdapterOptionInput =
	| Record<string, unknown>
	| ((...args: any[]) => Record<string, unknown> | undefined);

function isPlainOptions(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
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
	gestureEnabledRestoreByAdaptedOptions.set(adaptedOptions, {
		gestureEnabled:
			nativeOptions.gestureEnabled as ScreenTransitionConfig["gestureEnabled"],
		hasGestureEnabled: "gestureEnabled" in nativeOptions,
	});

	return adaptedOptions as TOptions;
}

export function resolveAdapterTransitionOptions<
	TOptions extends AdapterDescriptorOptions,
>(options: TOptions): TOptions & ScreenTransitionConfig {
	const gestureEnabledRestore = gestureEnabledRestoreByAdaptedOptions.get(
		options as Record<string, unknown>,
	);

	if (!gestureEnabledRestore) {
		return options;
	}

	const resolvedOptions = {
		...options,
		enableTransitions: true,
	};

	if (gestureEnabledRestore.hasGestureEnabled) {
		resolvedOptions.gestureEnabled = gestureEnabledRestore.gestureEnabled;
	} else {
		delete resolvedOptions.gestureEnabled;
	}

	return resolvedOptions;
}
