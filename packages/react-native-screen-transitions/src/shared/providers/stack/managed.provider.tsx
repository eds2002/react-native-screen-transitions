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
import { useClosingRouteMap } from "./helpers/use-closing-route-map";
import { useLocalRoutes } from "./helpers/use-local-routes";
import { useProcessedRoutes } from "./helpers/use-processed-routes";
import { useStackDerived } from "./helpers/use-stack-derived";

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
 * Shared fields (routes, scenes, etc.) live in StackContext.
 */
interface ManagedStackContextValue {
	activeScreensLimit: number;
	closingRouteKeysShared: SharedValue<string[]>;
	handleCloseRoute: (payload: { route: BaseStackRoute }) => void;
	backdropBehaviors: string[];
}

/**
 * Props passed to the render child of `withManagedStack`.
 * Only the fields that stack-view components actually consume.
 */
export interface ManagedStackRenderProps<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> {
	descriptors: Record<string, TDescriptor>;
	scenes: BaseStackScene<TDescriptor>[];
	focusedIndex: number;
	closingRouteMap: React.RefObject<Readonly<Record<string, true>>>;
	shouldShowFloatOverlay: boolean;
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
			scenes: processed.scenes as BaseStackScene[],
			stackProgress,
			optimisticFocusedIndex,
		}),
		[
			flags,
			processed.routeKeys,
			state.routes,
			processed.scenes,
			stackProgress,
			optimisticFocusedIndex,
		],
	);

	// Managed-specific context (consumed by useManagedStackContext())
	const managedContextValue = useMemo<ManagedStackContextValue>(
		() => ({
			activeScreensLimit: processed.activeScreensLimit,
			closingRouteKeysShared: closingRouteKeys.shared,
			handleCloseRoute,
			backdropBehaviors: processed.backdropBehaviors,
		}),
		[
			processed.activeScreensLimit,
			closingRouteKeys.shared,
			handleCloseRoute,
			processed.backdropBehaviors,
		],
	);

	// Combined props for render children (stack-view components)
	const renderProps = useMemo<ManagedStackRenderProps<TDescriptor>>(
		() => ({
			descriptors: state.descriptors,
			scenes: processed.scenes,
			focusedIndex,
			closingRouteMap,
			shouldShowFloatOverlay: processed.shouldShowFloatOverlay,
		}),
		[
			state.descriptors,
			processed.scenes,
			focusedIndex,
			closingRouteMap,
			processed.shouldShowFloatOverlay,
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
