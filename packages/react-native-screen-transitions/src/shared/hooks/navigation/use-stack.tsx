import type { Route } from "@react-navigation/native";
import { createContext, useContext } from "react";
import type { DerivedValue } from "react-native-reanimated";
import type { BaseNavigation } from "../../providers/screen/keys.provider";
import type { OverlayProps } from "../../types/core.types";

/**
 * Base descriptor type for shared components.
 * Uses loose typing to be compatible with both BlankStack and NativeStack descriptors.
 */
export interface StackDescriptor {
	route: Route<string>;
	navigation: BaseNavigation;
	options: {
		overlay?: (props: OverlayProps) => React.ReactNode;
		overlayMode?: "float" | "screen" | "container";
		overlayShown?: boolean;
		meta?: Record<string, unknown>;
		enableTransitions?: boolean;
	};
}

/**
 * Scene type for stack context (route + descriptor pair).
 */
export interface StackScene {
	route: Route<string>;
	descriptor: StackDescriptor;
}

/**
 * Common stack context value that both managed and direct stack providers populate.
 * Used by overlays and shared components that need stack progress info.
 */
export interface StackContextValue {
	/**
	 * Stack flags.
	 */
	flags: {
		TRANSITIONS_ALWAYS_ON: boolean;
	};
	/**
	 * Route keys for all routes in the stack.
	 */
	routeKeys: string[];
	/**
	 * All routes in the stack.
	 */
	routes: Route<string>[];
	/**
	 * Descriptor map for all routes.
	 */
	descriptors: Record<string, StackDescriptor>;
	/**
	 * Pre-computed scenes (route + descriptor pairs).
	 */
	scenes: StackScene[];
	/**
	 * The current focused index from navigation state.
	 */
	focusedIndex: number;
	/**
	 * Aggregated stack progress across all routes.
	 * Sum of all individual screen progress values.
	 * When 4 screens are fully visible, stackProgress = 4.
	 */
	stackProgress: DerivedValue<number>;
	/**
	 * Focused index that accounts for closing screens.
	 * Returns currentIndex - 1 if any screen is closing, otherwise currentIndex.
	 */
	optimisticFocusedIndex: DerivedValue<number>;
}

export const StackContext = createContext<StackContextValue | null>(null);
StackContext.displayName = "Stack";

/**
 * Hook to access common stack context values.
 * Works in both blank-stack and native-stack navigators.
 */
export function useStack<T extends StackContextValue = StackContextValue>(): T {
	const context = useContext(StackContext);

	if (context === null) {
		throw new Error("useStack must be used within a Stack provider");
	}

	return context as T;
}
