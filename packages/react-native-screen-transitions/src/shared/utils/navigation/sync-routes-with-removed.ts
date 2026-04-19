import type { useClosingRouteKeys } from "../../hooks/navigation/use-closing-route-keys";
import type { RouteWithKey } from "../../types/stack.types";
import { composeDescriptors } from "./compose-descriptors";

type SyncRoutesWithRemovedParams<
	Route extends RouteWithKey,
	DescriptorMap extends Record<string, unknown>,
> = {
	prevRoutes: Route[];
	prevDescriptors: DescriptorMap;
	nextRoutes: Route[];
	nextDescriptors: DescriptorMap;
	closingRouteKeys: ReturnType<typeof useClosingRouteKeys>;
};

/**
 * Synchronizes routes while handling removed routes that may still be animating out.
 * This manages the complex logic of keeping closing routes visible during transitions.
 */
export const syncRoutesWithRemoved = <
	Route extends RouteWithKey,
	DescriptorMap extends Record<string, unknown>,
>({
	prevRoutes,
	prevDescriptors,
	nextRoutes,
	nextDescriptors,
	closingRouteKeys,
}: SyncRoutesWithRemovedParams<Route, DescriptorMap>): {
	routes: Route[];
	descriptors: DescriptorMap;
} => {
	if (nextRoutes.length === 0) {
		closingRouteKeys.clear();
		return {
			routes: nextRoutes,
			descriptors: {} as DescriptorMap,
		};
	}

	// Start with next routes, will mutate if needed
	const derivedRoutes: Route[] = nextRoutes.slice();

	// Get focused (last) routes for comparison
	const previousFocusedRoute = prevRoutes[prevRoutes.length - 1];
	const nextFocusedRoute = nextRoutes[nextRoutes.length - 1];

	// Handle focus changes between routes
	if (
		previousFocusedRoute &&
		nextFocusedRoute &&
		previousFocusedRoute.key !== nextFocusedRoute.key
	) {
		const nextRouteWasPresent = prevRoutes.some(
			(route) => route.key === nextFocusedRoute.key,
		);
		const previousRouteStillPresent = nextRoutes.some(
			(route) => route.key === previousFocusedRoute.key,
		);

		if (nextRouteWasPresent && !previousRouteStillPresent) {
			// Previous route was removed, mark as closing
			closingRouteKeys.add(previousFocusedRoute.key);

			derivedRoutes.push(previousFocusedRoute);
		} else {
			// Next route is now active, not closing
			closingRouteKeys.remove(nextFocusedRoute.key);

			if (!previousRouteStillPresent) {
				// Previous route needs to be inserted for transition
				closingRouteKeys.remove(previousFocusedRoute.key);

				const insertIndex = Math.max(derivedRoutes.length - 1, 0);
				derivedRoutes.splice(insertIndex, 0, previousFocusedRoute);
			}
		}
	} else if (nextFocusedRoute) {
		// Same focused route, ensure it's not marked as closing
		closingRouteKeys.remove(nextFocusedRoute.key);
	}

	// Clean up closing keys that are no longer in the route list
	const activeKeys = new Set(derivedRoutes.map((route) => route.key));
	for (const key of Array.from(closingRouteKeys.ref.current)) {
		if (!activeKeys.has(key)) {
			closingRouteKeys.remove(key);
		}
	}

	return {
		routes: derivedRoutes,
		descriptors: composeDescriptors(
			derivedRoutes,
			nextDescriptors,
			prevDescriptors,
		),
	};
};
