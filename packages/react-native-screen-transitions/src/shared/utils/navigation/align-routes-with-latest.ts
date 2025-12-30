import { composeDescriptors } from "./compose-descriptors";

interface RouteWithKey {
	key: string;
}

/**
 * Aligns current routes with the latest route data while preserving references
 * when possible for performance optimization
 */
export const alignRoutesWithLatest = <
	Route extends RouteWithKey,
	DescriptorMap extends Record<string, unknown>,
>(
	currentRoutes: Route[],
	currentDescriptors: DescriptorMap,
	nextRoutes: Route[],
	nextDescriptors: DescriptorMap,
): { routes: Route[]; descriptors: DescriptorMap } => {
	// Early return for empty current routes
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

	// Create lookup map for efficient route finding
	const nextRouteLookup = new Map<string, Route>();
	for (const route of nextRoutes) {
		nextRouteLookup.set(route.key, route);
	}

	// Track if any changes occurred
	let didChange = currentRoutes.length !== nextRoutes.length;

	// Align routes, updating references where needed
	const alignedRoutes = currentRoutes.map((route) => {
		const nextRoute = nextRouteLookup.get(route.key);

		if (!nextRoute) {
			return route; // Keep current route if not in next
		}

		if (nextRoute !== route) {
			didChange = true;
			return nextRoute; // Update to new route reference
		}

		return route; // Keep current route reference
	});

	// Only create new array if changes occurred
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
