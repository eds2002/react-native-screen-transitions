import { useMemo } from "react";
import {
	AnimationStore,
	type AnimationStoreMap,
} from "../stores/animation.store";
import createProvider from "../utils/create-provider";

interface RoutesProviderProps {
	children: React.ReactNode;
	routeKeys: string[];
}

interface RoutesContextValue {
	/**
	 * Array of route keys for all routes in the stack, in order.
	 */
	routeKeys: string[];
}

const { RoutesProvider, useRoutesContext } = createProvider("Routes", {
	guarded: false,
})<RoutesProviderProps, RoutesContextValue>(({ routeKeys }) => ({
	value: { routeKeys },
}));

export { RoutesProvider };

/**
 * Hook to get animation values for all screens from a given index onwards.
 * Useful for computing accumulated progress across multiple screens.
 */
export function useStackAnimationValues(
	currentRouteKey: string | undefined,
): AnimationStoreMap[] {
	const routesContext = useRoutesContext();

	return useMemo(() => {
		if (!currentRouteKey || !routesContext) {
			return [];
		}

		const { routeKeys } = routesContext;
		const currentIndex = routeKeys.indexOf(currentRouteKey);

		if (currentIndex === -1) {
			return [];
		}

		// Get animation values for all screens from current index onwards
		return routeKeys
			.slice(currentIndex)
			.map((key) => AnimationStore.getAll(key));
	}, [currentRouteKey, routesContext]);
}
