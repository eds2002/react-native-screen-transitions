import { AnimationStore } from "../../../../stores/animation.store";
import { BoundStore } from "../../../../stores/bounds";
import { GestureStore } from "../../../../stores/gesture.store";

/**
 * Reset all stores for a given route key.
 */
export const resetStoresForRoute = (routeKey: string) => {
	AnimationStore.clear(routeKey);
	GestureStore.clear(routeKey);
	BoundStore.clearByAncestor(routeKey);
};
