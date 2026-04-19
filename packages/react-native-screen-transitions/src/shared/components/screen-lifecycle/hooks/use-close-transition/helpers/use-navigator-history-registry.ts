import { useEffect } from "react";
import { HistoryStore } from "../../../../../stores/history.store";

const mountedRoutesByNavigator = new Map<string, Set<string>>();

function registerMountedRoute(navigatorKey: string, routeKey: string): void {
	if (!navigatorKey || !routeKey) return;

	let routes = mountedRoutesByNavigator.get(navigatorKey);
	if (!routes) {
		routes = new Set();
		mountedRoutesByNavigator.set(navigatorKey, routes);
	}

	routes.add(routeKey);
}

/**
 * Removes the route from its navigator set.
 * Returns true when the navigator has no mounted routes left.
 */
function unregisterMountedRoute(
	navigatorKey: string,
	routeKey: string,
): boolean {
	if (!navigatorKey || !routeKey) return false;

	const routes = mountedRoutesByNavigator.get(navigatorKey);
	if (!routes) return false;

	routes.delete(routeKey);

	if (routes.size > 0) {
		return false;
	}

	mountedRoutesByNavigator.delete(navigatorKey);
	return true;
}

export const useNavigatorHistoryRegistry = (
	navigatorKey: string,
	routeKey: string,
) => {
	useEffect(() => {
		registerMountedRoute(navigatorKey, routeKey);

		return () => {
			const shouldClearNavigator = unregisterMountedRoute(
				navigatorKey,
				routeKey,
			);
			if (shouldClearNavigator) {
				HistoryStore.clearNavigator(navigatorKey);
			}
		};
	}, [navigatorKey, routeKey]);
};
