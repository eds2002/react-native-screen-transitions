import { createContext, useContext, useMemo } from "react";
import type { BaseStackDescriptor } from "../../types/stack.types";

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
}

const KeysContext = createContext<KeysContextType | undefined>(undefined);

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
	const value = useMemo<KeysContextType<TDescriptor>>(
		() => ({ previous, current, next }),
		[previous, current, next],
	);

	return <KeysContext.Provider value={value}>{children}</KeysContext.Provider>;
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
