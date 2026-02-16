import type { Route } from "@react-navigation/native";
import * as React from "react";
import { useEffect, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import {
	StackContext,
	type StackContextValue,
} from "../../hooks/navigation/use-stack";
import { HistoryStore } from "../../stores/history.store";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackScene,
	BaseStackState,
} from "../../types/stack.types";
import { useStackCoreContext } from "./core.provider";
import { useLocalRoutes } from "./helpers/use-local-routes";
import { useProcessedRoutes } from "./helpers/use-processed-routes";
import { useStackDerived } from "./helpers/use-stack-derived";
import { useClosingRouteMap } from "./helpers/use-visually-closing-route-map";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Props for managed stack - generic over descriptor and navigation types.
 * Defaults to base types for backward compatibility.
 */
export interface ManagedStackProps<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
> {
	state: BaseStackState<TDescriptor["route"]>;
	navigation: TNavigation;
	descriptors: Record<string, TDescriptor>;
	describe: (route: TDescriptor["route"], placeholder: boolean) => TDescriptor;
}

/**
 * Context value for managed stack — only fields unique to managed lifecycle.
 * Shared fields (routes, scenes, focusedIndex, etc.) live in StackContext.
 */
interface ManagedStackContextValue {
	activeScreensLimit: number;
	closingRouteKeysShared: SharedValue<string[]>;
	handleCloseRoute: (payload: { route: BaseStackRoute }) => void;
	shouldShowFloatOverlay: boolean;
	backdropBehaviors: string[];
}

/**
 * Props passed to the render child of `withManagedStack`.
 * Combines managed-specific fields with typed scene data from StackContext
 * so stack-view components have everything they need in one place.
 */
export interface ManagedStackRenderProps<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> extends ManagedStackContextValue {
	routes: TDescriptor["route"][];
	descriptors: Record<string, TDescriptor>;
	scenes: BaseStackScene<TDescriptor>[];
	focusedIndex: number;
	closingRouteMap: React.RefObject<Readonly<Record<string, true>>>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ManagedStackContext =
	React.createContext<ManagedStackContextValue | null>(null);
ManagedStackContext.displayName = "ManagedStack";

function useManagedStackContext(): ManagedStackContextValue {
	const context = React.useContext(ManagedStackContext);
	if (!context) {
		throw new Error(
			"useManagedStackContext must be used within ManagedStackProvider",
		);
	}
	return context;
}

// ---------------------------------------------------------------------------
// Hook — thin orchestrator
// ---------------------------------------------------------------------------

interface ManagedStackResult<TDescriptor extends BaseStackDescriptor> {
	stackContextValue: StackContextValue;
	managedContextValue: ManagedStackContextValue;
	renderProps: ManagedStackRenderProps<TDescriptor>;
}

function useManagedStackValue<
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>(
	props: ManagedStackProps<TDescriptor, TNavigation>,
): ManagedStackResult<TDescriptor> {
	const { flags } = useStackCoreContext();
	const { state, handleCloseRoute, closingRouteKeys } = useLocalRoutes(props);

	const processed = useProcessedRoutes(state.routes, state.descriptors);
	const { stackProgress, optimisticFocusedIndex } = useStackDerived(
		processed.animationMaps,
	);
	const closingRouteMap = useClosingRouteMap(
		processed.routeKeys,
		processed.animationMaps,
	);

	const focusedIndex = props.state.index;

	// Common stack context (consumed by useStack())
	const stackContextValue = useMemo<StackContextValue>(
		() => ({
			flags,
			routeKeys: processed.routeKeys,
			routes: state.routes as Route<string>[],
			descriptors: state.descriptors as Record<string, BaseStackDescriptor>,
			scenes: processed.scenes as BaseStackScene[],
			focusedIndex,
			stackProgress,
			optimisticFocusedIndex,
			closingRouteMap,
		}),
		[
			flags,
			processed.routeKeys,
			state.routes,
			state.descriptors,
			processed.scenes,
			focusedIndex,
			stackProgress,
			optimisticFocusedIndex,
			closingRouteMap,
		],
	);

	// Managed-specific context (consumed by useManagedStackContext())
	const managedContextValue = useMemo<ManagedStackContextValue>(
		() => ({
			activeScreensLimit: processed.activeScreensLimit,
			closingRouteKeysShared: closingRouteKeys.shared,
			handleCloseRoute,
			shouldShowFloatOverlay: processed.shouldShowFloatOverlay,
			backdropBehaviors: processed.backdropBehaviors,
		}),
		[
			processed.activeScreensLimit,
			closingRouteKeys.shared,
			handleCloseRoute,
			processed.shouldShowFloatOverlay,
			processed.backdropBehaviors,
		],
	);

	// Combined props for render children (stack-view components)
	const renderProps = useMemo<ManagedStackRenderProps<TDescriptor>>(
		() => ({
			...managedContextValue,
			routes: state.routes,
			descriptors: state.descriptors,
			scenes: processed.scenes,
			focusedIndex,
			closingRouteMap,
		}),
		[
			managedContextValue,
			state.routes,
			state.descriptors,
			processed.scenes,
			focusedIndex,
			closingRouteMap,
		],
	);

	return { stackContextValue, managedContextValue, renderProps };
}

// ---------------------------------------------------------------------------
// HOC
// ---------------------------------------------------------------------------

/**
 * HOC that wraps component with ManagedStack provider AND StackContext.
 * Used by blank-stack and component-stack which manage local route state
 * for closing animations.
 */
function withManagedStack<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
>(
	Component: React.ComponentType<ManagedStackRenderProps<TDescriptor>>,
): React.FC<ManagedStackProps<TDescriptor, TNavigation>> {
	return function ManagedStackProvider(
		props: ManagedStackProps<TDescriptor, TNavigation>,
	) {
		const navigatorKey = props.state.key;

		// Clean up history when navigator unmounts
		useEffect(() => {
			return () => {
				HistoryStore.clearNavigator(navigatorKey);
			};
		}, [navigatorKey]);

		const { stackContextValue, managedContextValue, renderProps } =
			useManagedStackValue<TDescriptor, TNavigation>(props);

		return (
			<StackContext.Provider value={stackContextValue}>
				<ManagedStackContext.Provider value={managedContextValue}>
					<Component {...renderProps} />
				</ManagedStackContext.Provider>
			</StackContext.Provider>
		);
	};
}

export { useManagedStackContext, withManagedStack };
