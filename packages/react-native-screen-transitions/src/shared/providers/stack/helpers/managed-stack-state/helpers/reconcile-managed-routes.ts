import type {
	BaseStackDescriptor,
	RouteWithKey,
} from "../../../../../types/stack.types";
import { composeDescriptors } from "../../../../../utils/navigation/compose-descriptors";
import { syncRoutesWithRemoved } from "../../../../../utils/navigation/sync-routes-with-removed";
import type {
	LocalRoutesState,
	ManagedDescriptorSources,
	ManagedRoutes,
	ReconciledRoutes,
} from "./types";

type ReconcileManagedRoutesParams<TDescriptor extends BaseStackDescriptor> = {
	current: LocalRoutesState<TDescriptor>;
	previousRoutesSnapshot: ManagedRoutes<TDescriptor>;
	nextRoutesSnapshot: ManagedRoutes<TDescriptor>;
	nextDescriptors: ManagedDescriptorSources<TDescriptor>;
	closingRouteKeys: Set<string>;
};

const haveSameRouteKeys = <Route extends RouteWithKey>(
	previous: Route[],
	next: Route[],
): boolean => {
	if (previous.length !== next.length) {
		return false;
	}

	return previous.every((route, index) => route?.key === next[index]?.key);
};

const alignRoutesWithLatest = <
	Route extends RouteWithKey,
	DescriptorMap extends Record<string, unknown>,
>(
	currentRoutes: Route[],
	currentDescriptors: DescriptorMap,
	nextRoutes: Route[],
	nextDescriptors: DescriptorMap,
): { routes: Route[]; descriptors: DescriptorMap } => {
	if (currentRoutes.length === 0) {
		return {
			routes: nextRoutes,
			descriptors: composeDescriptors(
				nextRoutes,
				nextDescriptors,
				currentDescriptors,
			),
		};
	}

	const nextRouteLookup = new Map<string, Route>();
	for (const route of nextRoutes) {
		nextRouteLookup.set(route.key, route);
	}

	let didChange = currentRoutes.length !== nextRoutes.length;
	const alignedRoutes = currentRoutes.map((route) => {
		const nextRoute = nextRouteLookup.get(route.key);

		if (!nextRoute) {
			return route;
		}

		if (nextRoute !== route) {
			didChange = true;
			return nextRoute;
		}

		return route;
	});
	const routesResult = didChange ? alignedRoutes : currentRoutes;

	return {
		routes: routesResult,
		descriptors: composeDescriptors(
			routesResult,
			nextDescriptors,
			currentDescriptors,
		),
	};
};

const acceptAlreadyClosingRouteRemovals = <
	TDescriptor extends BaseStackDescriptor,
>({
	current,
	previousRoutesSnapshot,
	nextRoutesSnapshot,
	nextDescriptors,
	closingRouteKeys,
}: ReconcileManagedRoutesParams<TDescriptor>): ReconciledRoutes<TDescriptor> | null => {
	// React Navigation may remove a route that we already marked closing. Accept
	// those removals, while keeping any other closing routes alive locally.
	const nextRouteKeys = new Set(nextRoutesSnapshot.map((route) => route.key));
	const acceptedRemovedKeys = new Set<string>();

	for (const route of previousRoutesSnapshot) {
		if (nextRouteKeys.has(route.key)) {
			continue;
		}

		if (!closingRouteKeys.has(route.key)) {
			continue;
		}

		acceptedRemovedKeys.add(route.key);
		closingRouteKeys.delete(route.key);
	}

	if (acceptedRemovedKeys.size === 0) {
		return null;
	}

	const remainingClosingRoutes = current.routes.filter((route) => {
		if (nextRouteKeys.has(route.key)) {
			return false;
		}

		if (acceptedRemovedKeys.has(route.key)) {
			return false;
		}

		return closingRouteKeys.has(route.key);
	});

	const routes = [
		...nextRoutesSnapshot,
		...remainingClosingRoutes,
	] as ManagedRoutes<TDescriptor>;
	const descriptors = {
		...nextDescriptors,
	} as ManagedDescriptorSources<TDescriptor>;

	for (const route of remainingClosingRoutes) {
		const descriptor = current.sourceDescriptors[route.key];
		if (descriptor) {
			descriptors[route.key] = descriptor;
		}
	}

	return {
		routes,
		descriptors,
	};
};

export const reconcileManagedRoutes = <TDescriptor extends BaseStackDescriptor>(
	params: ReconcileManagedRoutesParams<TDescriptor>,
): ReconciledRoutes<TDescriptor> => {
	const {
		current,
		previousRoutesSnapshot,
		nextRoutesSnapshot,
		nextDescriptors,
		closingRouteKeys,
	} = params;

	const routeKeysUnchanged = haveSameRouteKeys(
		previousRoutesSnapshot,
		nextRoutesSnapshot,
	);

	if (routeKeysUnchanged) {
		// Same route shape, new descriptor objects. Keep local ordering but refresh
		// descriptor references from React Navigation.
		const result = alignRoutesWithLatest(
			current.routes,
			current.sourceDescriptors,
			nextRoutesSnapshot,
			nextDescriptors,
		);

		return {
			routes: result.routes as ManagedRoutes<TDescriptor>,
			descriptors: result.descriptors as ManagedDescriptorSources<TDescriptor>,
		};
	}

	const acceptedRemoval = acceptAlreadyClosingRouteRemovals(params);

	if (acceptedRemoval) {
		return acceptedRemoval;
	}

	const result = syncRoutesWithRemoved({
		prevRoutes:
			previousRoutesSnapshot.length > 0
				? previousRoutesSnapshot
				: current.routes,
		prevDescriptors: current.sourceDescriptors,
		nextRoutes: nextRoutesSnapshot,
		nextDescriptors,
		closingRouteKeys,
	});

	return {
		routes: result.routes as ManagedRoutes<TDescriptor>,
		descriptors: result.descriptors as ManagedDescriptorSources<TDescriptor>,
	};
};
