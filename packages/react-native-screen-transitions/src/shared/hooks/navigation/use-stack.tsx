import type { Route } from "@react-navigation/native";
import { createContext, useContext } from "react";
import type { DerivedValue } from "react-native-reanimated";
import type { OverlayMode, OverlayProps } from "../../types/overlay.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackScene,
} from "../../types/stack.types";

/**
 * Stack descriptor with overlay options.
 * Extends BaseStackDescriptor with overlay-specific options.
 */
export interface StackDescriptor<
	TRoute extends BaseStackRoute = Route<string>,
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
> extends BaseStackDescriptor<TRoute, TNavigation> {
	options: BaseStackDescriptor["options"] & {
		overlay?: (props: OverlayProps) => React.ReactNode;
		overlayMode?: OverlayMode;
		overlayShown?: boolean;
		meta?: Record<string, unknown>;
		enableTransitions?: boolean;
	};
}

/**
 * Scene type for stack context (route + descriptor pair).
 */
export type StackScene<TDescriptor extends StackDescriptor = StackDescriptor> =
	BaseStackScene<TDescriptor>;

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
