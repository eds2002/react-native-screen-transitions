import { AnimationStore } from "../../../../../stores/animation.store";
import { BoundStore } from "../../../../../stores/bounds";
import { GestureStore } from "../../../../../stores/gesture.store";

/**
 * Reset all stores for a given route key.
 *
 * When `isBranchScreen` is true the route hosts a nested navigator.
 * In that case clear all bound entries associated with that branch navigator.
 * Leaf screens only need their own animation / gesture cleanup.
 */
export const resetStoresForRoute = (
	routeKey: string,
	isBranchScreen: boolean,
	branchNavigatorKey?: string,
) => {
	AnimationStore.clear(routeKey);
	GestureStore.clear(routeKey);

	if (isBranchScreen) {
		BoundStore.clear(routeKey);

		if (branchNavigatorKey) {
			BoundStore.clearByBranch(branchNavigatorKey);
			return;
		}

		// Fallback path for stacks that cannot expose nested navigator state.
		BoundStore.clearByAncestor(routeKey);
	}
};
