import type { ScreenProps } from "react-native-screens";
import type { ScreenTransitionConfig } from "../../types";

type NativeStackTransitionResetOptions = {
	presentation: "containedTransparentModal";
	animation: "none";
	headerShown: false;
	gestureEnabled: false;
};

export type NativeStackNativeGestureOptions = {
	nativeGestureEnabled?: boolean;
	nativeGestureDirection?: ScreenProps["swipeDirection"];
	nativeGestureResponseDistance?: ScreenProps["gestureResponseDistance"];
};

export type ScreenTransitionDescriptorOptions = ScreenTransitionConfig & {
	enableTransitions?: boolean;
	screenTransition?: ScreenTransitionConfig | null | false;
};

export type NativeStackAdapterOptions<
	TNativeOptions extends object = Record<string, unknown>,
> = Omit<
	TNativeOptions,
	| keyof ScreenTransitionDescriptorOptions
	| keyof NativeStackNativeGestureOptions
> &
	ScreenTransitionDescriptorOptions &
	NativeStackNativeGestureOptions;

const NATIVE_STACK_TRANSITION_RESET_OPTIONS: NativeStackTransitionResetOptions =
	{
		presentation: "containedTransparentModal",
		animation: "none",
		headerShown: false,
		gestureEnabled: false,
	};

const COLLIDING_TRANSITION_OPTION_KEYS = [
	"gestureEnabled",
	"gestureDirection",
	"gestureResponseDistance",
] as const satisfies readonly (keyof ScreenTransitionConfig)[];

type CollidingTransitionOptionKey =
	(typeof COLLIDING_TRANSITION_OPTION_KEYS)[number];

export type NativeStackAdapterOptionInput =
	| Record<string, unknown>
	| ((...args: any[]) => Record<string, unknown> | undefined);

function isPlainOptions(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function extractCollidingTransitionOptions(
	options: Record<string, unknown>,
): ScreenTransitionConfig | undefined {
	let screenTransition: ScreenTransitionConfig | undefined;

	for (const key of COLLIDING_TRANSITION_OPTION_KEYS) {
		if (!(key in options)) {
			continue;
		}

		screenTransition ??= {};
		screenTransition[key] = options[key] as never;
	}

	return screenTransition;
}

function removeCollidingTransitionOptions<
	TOptions extends Record<string, unknown>,
>(options: TOptions): Omit<TOptions, CollidingTransitionOptionKey> {
	const nativeOptions = { ...options };

	for (const key of COLLIDING_TRANSITION_OPTION_KEYS) {
		delete nativeOptions[key];
	}

	return nativeOptions;
}

function applyNativeGestureAliases<TOptions extends Record<string, unknown>>(
	options: TOptions,
): TOptions {
	const nativeOptions: Record<string, unknown> = { ...options };
	const {
		nativeGestureEnabled,
		nativeGestureDirection,
		nativeGestureResponseDistance,
	} = options;
	delete nativeOptions.nativeGestureEnabled;
	delete nativeOptions.nativeGestureDirection;
	delete nativeOptions.nativeGestureResponseDistance;

	if (nativeGestureEnabled !== undefined) {
		nativeOptions.gestureEnabled = nativeGestureEnabled;
	}

	if (nativeGestureDirection !== undefined) {
		nativeOptions.gestureDirection = nativeGestureDirection;
	}

	if (nativeGestureResponseDistance !== undefined) {
		nativeOptions.gestureResponseDistance = nativeGestureResponseDistance;
	}

	return nativeOptions as TOptions;
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

	const inlineScreenTransition = extractCollidingTransitionOptions(options);
	const explicitScreenTransition = options.screenTransition;
	const hasTransitionsEnabled =
		options.enableTransitions === true || !!explicitScreenTransition;

	if (!hasTransitionsEnabled) {
		return applyNativeGestureAliases(options) as TOptions;
	}

	const nativeOptions = applyNativeGestureAliases(
		removeCollidingTransitionOptions(options),
	);
	const nativeGestureEnabled = nativeOptions.gestureEnabled;
	const screenTransition =
		explicitScreenTransition && isPlainOptions(explicitScreenTransition)
			? {
					...inlineScreenTransition,
					...explicitScreenTransition,
				}
			: inlineScreenTransition;

	return {
		...nativeOptions,
		...NATIVE_STACK_TRANSITION_RESET_OPTIONS,
		...(nativeGestureEnabled !== undefined
			? { gestureEnabled: nativeGestureEnabled }
			: null),
		enableTransitions: true,
		...(screenTransition ? { screenTransition } : null),
	} as TOptions;
}

export function resolveScreenTransitionOptions<
	TOptions extends ScreenTransitionDescriptorOptions,
>(options: TOptions): TOptions & ScreenTransitionConfig {
	const screenTransition = options.screenTransition;

	if (!screenTransition) {
		return options;
	}

	return {
		...options,
		...screenTransition,
		enableTransitions: true,
	};
}
