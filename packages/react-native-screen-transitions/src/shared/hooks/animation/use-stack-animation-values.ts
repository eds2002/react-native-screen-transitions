import { useMemo } from "react";
import { useStackRootContext } from "../../providers/stack-root.provider";
import {
	AnimationStore,
	type AnimationStoreMap,
} from "../../stores/animation.store";

/**
 * Hook to get animation values for all screens from a given index onwards.
 * Useful for computing accumulated progress across multiple screens.
 */
export function useStackAnimationValues(
	currentRouteKey: string | undefined,
): AnimationStoreMap[] {
	const routesContext = useStackRootContext();

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
