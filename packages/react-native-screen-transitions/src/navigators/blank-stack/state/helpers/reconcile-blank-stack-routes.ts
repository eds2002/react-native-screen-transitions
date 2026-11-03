import type { BlankStackDescriptorSources } from "../../../../types/providers/blank-stack-provider.types";
import type { RouteWithKey } from "../../../../types/stack.types";
import { composeDescriptors } from "./navigation/compose-descriptors";
import { syncRoutesWithRemoved } from "./navigation/sync-routes-with-removed";
import { routesHaveSameKeys } from "./state-equality";
import type {
	BlankStackRoutes,
	LocalRoutesState,
	ReconciledRoutes,
} from "./types";

type ReconcileBlankStackRoutesParams = {
	current: LocalRoutesState;
	previousRoutesSnapshot: BlankStackRoutes;
	nextRoutesSnapshot: BlankStackRoutes;
	nextDescriptors: BlankStackDescriptorSources;
	closingRouteKeys: Set<string>;
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

const acceptAlreadyClosingRouteRemovals = ({
	current,
	previousRoutesSnapshot,
	nextRoutesSnapshot,
	nextDescriptors,
	closingRouteKeys,
}: ReconcileBlankStackRoutesParams): ReconciledRoutes | null => {
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

	// An acknowledgement can arrive together with a new pop. Reconcile that
	// pop after removing the acknowledged routes from the previous snapshot.
	const hasNewRemoval = previousRoutesSnapshot.some(
		(route) =>
			!nextRouteKeys.has(route.key) && !acceptedRemovedKeys.has(route.key),
	);
	const result = hasNewRemoval
		? syncRoutesWithRemoved({
				prevRoutes: previousRoutesSnapshot.filter(
					(route) => !acceptedRemovedKeys.has(route.key),
				),
				prevDescriptors: current.sourceDescriptors,
				nextRoutes: nextRoutesSnapshot,
				nextDescriptors,
				closingRouteKeys,
			})
		: { routes: nextRoutesSnapshot };
	const routes = [...result.routes];
	if (nextRoutesSnapshot.length > 0) {
		for (const route of remainingClosingRoutes) {
			if (!routes.some((candidate) => candidate.key === route.key))
				routes.push(route);
			closingRouteKeys.add(route.key);
		}
	}
	const descriptors = composeDescriptors(
		routes,
		nextDescriptors,
		current.sourceDescriptors,
	);

	return {
		routes,
		descriptors,
	};
};

export const reconcileBlankStackRoutes = (
	params: ReconcileBlankStackRoutesParams,
): ReconciledRoutes => {
	const {
		current,
		previousRoutesSnapshot,
		nextRoutesSnapshot,
		nextDescriptors,
		closingRouteKeys,
	} = params;

	const routeKeysUnchanged = routesHaveSameKeys(
		previousRoutesSnapshot,
		nextRoutesSnapshot,
	);

	if (routeKeysUnchanged) {
		const result = alignRoutesWithLatest(
			current.routes,
			current.sourceDescriptors,
			nextRoutesSnapshot,
			nextDescriptors,
		);

		return {
			routes: result.routes,
			descriptors: result.descriptors,
		};
	}

	const acceptedRemoval = acceptAlreadyClosingRouteRemovals(params);

	if (acceptedRemoval) {
		return acceptedRemoval;
	}

	// Routes still animating their close exist only here (navigation already removed them).
	const closingBefore = current.routes.filter((route) =>
		closingRouteKeys.has(route.key),
	);

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

	return keepClosingRoutes({
		routes: result.routes,
		descriptors: result.descriptors,
		closingBefore,
		current,
		nextDescriptors,
		closingRouteKeys,
	});
};

/**
 * A navigation change that lands while a route is still closing (a push during a pop) used to drop
 * that route at once, so it vanished mid-animation. Keep it in its slot, under any route the change
 * added, until its close finishes (the controller's handleCloseRoute removes it then).
 */
const keepClosingRoutes = ({
	routes,
	descriptors,
	closingBefore,
	current,
	nextDescriptors,
	closingRouteKeys,
}: {
	routes: ReconciledRoutes["routes"];
	descriptors: ReconciledRoutes["descriptors"];
	closingBefore: LocalRoutesState["routes"];
	current: LocalRoutesState;
	nextDescriptors: BlankStackDescriptorSources;
	closingRouteKeys: Set<string>;
}): ReconciledRoutes => {
	if (routes.length === 0) {
		return { routes, descriptors };
	}
	const present = new Set(routes.map((route) => route.key));
	const dropped = closingBefore.filter((route) => !present.has(route.key));
	if (dropped.length === 0) {
		return { routes, descriptors };
	}
	const previousKeys = new Set(current.routes.map((route) => route.key));
	const firstAdded = routes.findIndex((route) => !previousKeys.has(route.key));
	const insertAt = firstAdded === -1 ? routes.length : firstAdded;
	const kept = [
		...routes.slice(0, insertAt),
		...dropped,
		...routes.slice(insertAt),
	];
	for (const route of dropped) {
		closingRouteKeys.add(route.key);
	}
	return {
		routes: kept,
		descriptors: composeDescriptors(
			kept,
			nextDescriptors,
			current.sourceDescriptors,
		),
	};
};
