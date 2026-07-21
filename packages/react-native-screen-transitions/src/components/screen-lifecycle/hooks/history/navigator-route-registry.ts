const mountedRoutesByNavigator = new Map<string, Set<string>>();

export function registerMountedRoute(
	navigatorKey: string,
	routeKey: string,
): void {
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
export function unregisterMountedRoute(
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

/**
 * @internal test helper
 */
export function _resetNavigatorRouteRegistry(): void {
	mountedRoutesByNavigator.clear();
}
