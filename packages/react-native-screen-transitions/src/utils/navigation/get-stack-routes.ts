type StackRoutesState<Route> = {
	routes: Route[];
	index: number;
	preloadedRoutes?: Route[];
};

/**
 * Splits a stack state into its active and preloaded routes.
 * React Navigation keeps preloaded routes in `preloadedRoutes`, while
 * Expo Router 58+ keeps them in `routes` after `index`.
 */
export function getStackRoutes<Route>(state: StackRoutesState<Route>) {
	const activeCount = state.index + 1;

	if (state.routes.length <= activeCount) {
		return {
			routes: state.routes,
			preloadedRoutes: state.preloadedRoutes ?? [],
		};
	}

	return {
		routes: state.routes.slice(0, activeCount),
		preloadedRoutes: state.routes.slice(activeCount),
	};
}
