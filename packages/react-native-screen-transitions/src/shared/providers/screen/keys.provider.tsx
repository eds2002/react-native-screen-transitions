import type {
	Descriptor,
	NavigationProp,
	ParamListBase,
	RouteProp,
} from "@react-navigation/native";
import { createContext, useContext, useMemo } from "react";
import type { ScreenTransitionConfig } from "../../types/core.types";

/**
 * Base route interface - minimal contract for all stack types
 */
export interface BaseRoute {
	key: string;
}

/**
 * Navigation interface for gesture handling - both React Navigation and
 * component-stack navigation objects must satisfy this contract.
 */
export interface BaseNavigation {
	getState: () => { routes: Array<{ key: string }>; key: string };
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	dispatch: (action: any) => void;
}

/**
 * Base descriptor interface - minimal contract for all stack types.
 * This allows component-stack, blank-stack, and native-stack to all
 * work with the shared providers without tight coupling to React Navigation.
 */
export interface BaseDescriptor {
	route: BaseRoute;
	options: ScreenTransitionConfig;
	navigation: BaseNavigation;
}

/**
 * React Navigation specific descriptor - extends base with full typing
 */
export type TransitionDescriptor = Descriptor<
	ScreenTransitionConfig,
	NavigationProp<ParamListBase>,
	RouteProp<ParamListBase>
>;

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
