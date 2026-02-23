import type { Route } from "@react-navigation/native";
import * as React from "react";
import { useMemo } from "react";
import {
	StackContext,
	type StackContextValue,
} from "../../hooks/navigation/use-stack";
import type {
	ManagedStackContextValue,
	ManagedStackProps,
	ManagedStackRenderProps,
	ManagedStackResult,
} from "../../types/providers/managed-stack.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackScene,
} from "../../types/stack.types";
import { useStackCoreContext } from "./core.provider";
import { useClosingRouteMap } from "./helpers/use-closing-route-map";
import { useLocalRoutes } from "./helpers/use-local-routes";
import { useProcessedRoutes } from "./helpers/use-processed-routes";
import { useStackDerived } from "./helpers/use-stack-derived";

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

function useManagedStackValue<
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>(
	props: ManagedStackProps<TDescriptor, TNavigation>,
): ManagedStackResult<TDescriptor> {
	const { flags } = useStackCoreContext();
	const { state, handleCloseRoute, closingRouteKeys } = useLocalRoutes(props);
	const navigatorKey = props.state.key;

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
			navigatorKey,
			routeKeys: processed.routeKeys,
			routes: state.routes as Route<string>[],
			scenes: processed.scenes as BaseStackScene[],
			stackProgress,
			optimisticFocusedIndex,
		}),
		[
			flags,
			navigatorKey,
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

function withManagedStack<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
>(
	Component: React.ComponentType<ManagedStackRenderProps<TDescriptor>>,
): React.FC<ManagedStackProps<TDescriptor, TNavigation>> {
	return function ManagedStackProvider(
		props: ManagedStackProps<TDescriptor, TNavigation>,
	) {
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
export type {
	ManagedStackContextValue,
	ManagedStackProps,
	ManagedStackRenderProps,
};
