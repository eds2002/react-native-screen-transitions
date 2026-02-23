import { createContext, useContext, useMemo } from "react";
import type { BaseStackDescriptor } from "../../../types/stack.types";
import { getAncestorKeys } from "./helpers/get-ancestor-keys";

/**
 * Base descriptor interface - minimal contract for all stack types.
 * This allows blank-stack and native-stack to work with the shared
 * providers without tight coupling to React Navigation.
 */
export type BaseDescriptor = BaseStackDescriptor;

interface KeysContextType<TDescriptor extends BaseDescriptor = BaseDescriptor> {
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
	ancestorKeys: string[];
}

interface ScreenKeysContextType {
	previousScreenKey?: string;
	currentScreenKey: string;
	nextScreenKey?: string;
	ancestorKeys: string[];
	hasConfiguredInterpolator: boolean;
}

const KeysContext = createContext<KeysContextType | undefined>(undefined);
const ScreenKeysContext = createContext<ScreenKeysContextType | undefined>(
	undefined,
);

interface KeysProviderProps<TDescriptor extends BaseDescriptor> {
	children: React.ReactNode;
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
}

export function KeysProvider<TDescriptor extends BaseDescriptor>({
	children,
	previous,
	current,
	next,
}: KeysProviderProps<TDescriptor>) {
	const ancestorKeys = getAncestorKeys(current);
	const ancestorKeysSignature = ancestorKeys.join("|");
	const previousScreenKey = previous?.route.key;
	const currentScreenKey = current.route.key;
	const nextScreenKey = next?.route.key;
	const hasConfiguredInterpolator =
		!!current.options.screenStyleInterpolator ||
		!!next?.options?.screenStyleInterpolator;

	// biome-ignore lint/correctness/useExhaustiveDependencies: <Depend on the signature instead>
	const value = useMemo<KeysContextType<TDescriptor>>(
		() => ({
			previous,
			current,
			next,
			ancestorKeys,
		}),
		[previous, current, next, ancestorKeysSignature],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <Depend on the signature instead>
	const screenKeysValue = useMemo<ScreenKeysContextType>(
		() => ({
			previousScreenKey,
			currentScreenKey,
			nextScreenKey,
			ancestorKeys,
			hasConfiguredInterpolator,
		}),
		[
			previousScreenKey,
			currentScreenKey,
			nextScreenKey,
			ancestorKeysSignature,
			hasConfiguredInterpolator,
		],
	);

	return (
		<KeysContext.Provider value={value}>
			<ScreenKeysContext.Provider value={screenKeysValue}>
				{children}
			</ScreenKeysContext.Provider>
		</KeysContext.Provider>
	);
}

export function useKeys<
	TDescriptor extends BaseDescriptor = BaseDescriptor,
>(): KeysContextType<TDescriptor> {
	const context = useContext(KeysContext);
	if (context === undefined) {
		throw new Error("useKeys must be used within a KeysProvider");
	}
	return context as KeysContextType<TDescriptor>;
}

export function useScreenKeys(): ScreenKeysContextType {
	const context = useContext(ScreenKeysContext);
	if (context === undefined) {
		throw new Error("useScreenKeys must be used within a KeysProvider");
	}
	return context;
}
