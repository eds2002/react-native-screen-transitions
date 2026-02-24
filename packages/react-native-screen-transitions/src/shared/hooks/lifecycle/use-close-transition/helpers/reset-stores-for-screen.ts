import { AnimationStore } from "../../../../stores/animation.store";
import { BoundStore } from "../../../../stores/bounds";
import { GestureStore } from "../../../../stores/gesture.store";

/**
 * Reset all stores for a given route key.
 *
 * When `isBranchScreen` is true the route hosts a nested navigator,
 * so we also clear bound entries that were registered as descendants
 * of this route (ancestor-based clearing).  Leaf screens only need
 * their own animation / gesture / direct-bound cleanup.
 */
export const resetStoresForRoute = (
	routeKey: string,
	isBranchScreen: boolean,
) => {
	AnimationStore.clear(routeKey);
	GestureStore.clear(routeKey);

	if (isBranchScreen) {
		BoundStore.clearByAncestor(routeKey);
	}
};
