import type {
	Descriptor,
	NavigationProp,
	ParamListBase,
	RouteProp,
} from "@react-navigation/native";
import { createContext, useContext, useMemo } from "react";
import type { ScreenTransitionConfig } from "../types/core";

export type TransitionDescriptor = Descriptor<
	ScreenTransitionConfig,
	NavigationProp<ParamListBase>,
	RouteProp<ParamListBase>
>;

export interface KeysContextType<
	TDescriptor extends TransitionDescriptor = TransitionDescriptor,
> {
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
}

const KeysContext = createContext<
	KeysContextType<TransitionDescriptor> | undefined
>(undefined);

interface KeysProviderProps<TDescriptor extends TransitionDescriptor> {
	children: React.ReactNode;
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
}

export function KeysProvider<TDescriptor extends TransitionDescriptor>({
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
	TDescriptor extends TransitionDescriptor = TransitionDescriptor,
>(): KeysContextType<TDescriptor> {
	const context = useContext(KeysContext);
	if (context === undefined) {
		throw new Error("useKeys must be used within a KeysProvider");
	}
	return context as KeysContextType<TDescriptor>;
}
