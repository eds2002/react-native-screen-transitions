import type { useClosingRouteKeys } from "../../hooks/navigation/use-closing-route-keys";
import { AnimationStore } from "../../stores/animation.store";
import { GestureStore } from "../../stores/gesture.store";
import { composeDescriptors } from "./compose-descriptors";

interface RouteWithKey {
	key: string;
}

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

const isRouteDismissing = (routeKey: string): boolean => {
	const gestures = GestureStore.getRouteGestures(routeKey);
	const animations = AnimationStore.getAll(routeKey);
	return (
		gestures.isDragging.value === 1 ||
		gestures.isDismissing.value === 1 ||
		animations.closing.value === 1 ||
		animations.progress.value < 0.5
	);
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

	// Move mid-dismiss routes to the end so they can animate out
	// without affecting the transition of other screens
	const normalRoutes: Route[] = [];
	const dismissingRoutes: Route[] = [];

	for (let i = 0; i < nextRoutes.length; i++) {
		const route = nextRoutes[i];
		const isMiddle = i > 0 && i < nextRoutes.length - 1;

		if (isMiddle && isRouteDismissing(route.key)) {
			closingRouteKeys.add(route.key);
			dismissingRoutes.push(route);
		} else {
			normalRoutes.push(route);
		}
	}

	const derivedRoutes: Route[] = [...normalRoutes, ...dismissingRoutes];

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
				const insertIndex = Math.max(derivedRoutes.length - 1, 0);
				derivedRoutes.splice(insertIndex, 0, previousFocusedRoute);
				closingRouteKeys.remove(previousFocusedRoute.key);
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
