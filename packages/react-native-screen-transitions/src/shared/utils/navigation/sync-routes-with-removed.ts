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

	const isBeingDragged = gestures.isDragging.value === 1;
	const isProgrammaticallyDismissing = gestures.isDismissing.value === 1;
	const isClosing = animations.closing.value === 1;
	const hasNotFullyEntered = animations.progress.value < 0.5;

	return isBeingDragged || isProgrammaticallyDismissing || isClosing || hasNotFullyEntered;
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

	// Reorder mid-dismiss routes to the end so they animate out above newer routes.
	// Only middle routes are moved - first (root) and last (focused) stay in place.
	const stableRoutes: Route[] = [];
	const dismissingMiddleRoutes: Route[] = [];

	for (let i = 0; i < nextRoutes.length; i++) {
		const route = nextRoutes[i];
		const isFirstOrLast = i === 0 || i === nextRoutes.length - 1;

		if (!isFirstOrLast && isRouteDismissing(route.key)) {
			closingRouteKeys.add(route.key);
			dismissingMiddleRoutes.push(route);
		} else {
			stableRoutes.push(route);
		}
	}

	const routes: Route[] = [...stableRoutes, ...dismissingMiddleRoutes];

	// Handle focus transitions (when the top route changes)
	const previousFocusedRoute = prevRoutes[prevRoutes.length - 1];
	const nextFocusedRoute = nextRoutes[nextRoutes.length - 1];
	const focusHasChanged =
		previousFocusedRoute &&
		nextFocusedRoute &&
		previousFocusedRoute.key !== nextFocusedRoute.key;

	if (focusHasChanged) {
		const nextRouteExistedBefore = prevRoutes.some(
			(route) => route.key === nextFocusedRoute.key,
		);
		const previousRouteStillExists = nextRoutes.some(
			(route) => route.key === previousFocusedRoute.key,
		);

		if (nextRouteExistedBefore && !previousRouteStillExists) {
			// Back navigation: previous route was popped, keep it for exit animation
			closingRouteKeys.add(previousFocusedRoute.key);
			routes.push(previousFocusedRoute);
		} else {
			// Forward navigation: new route gained focus
			closingRouteKeys.remove(nextFocusedRoute.key);

			if (!previousRouteStillExists) {
				// Previous route was replaced, insert it underneath for transition
				const insertIndex = Math.max(routes.length - 1, 0);
				routes.splice(insertIndex, 0, previousFocusedRoute);
				closingRouteKeys.remove(previousFocusedRoute.key);
			}
		}
	} else if (nextFocusedRoute) {
		// Same focused route, ensure it's not marked as closing
		closingRouteKeys.remove(nextFocusedRoute.key);
	}

	// Clean up orphaned closing keys
	const activeKeys = new Set(routes.map((route) => route.key));
	for (const key of Array.from(closingRouteKeys.ref.current)) {
		if (!activeKeys.has(key)) {
			closingRouteKeys.remove(key);
		}
	}

	return {
		routes,
		descriptors: composeDescriptors(routes, nextDescriptors, prevDescriptors),
	};
};
