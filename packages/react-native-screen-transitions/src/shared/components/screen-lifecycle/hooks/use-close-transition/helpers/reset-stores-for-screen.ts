import { runOnUI } from "react-native-reanimated";
import { AnimationStore } from "../../../../../stores/animation.store";
import { BoundStore } from "../../../../../stores/bounds";
import { GestureStore } from "../../../../../stores/gesture.store";

export const resetStoresForScreen = (
	routeKey: string,
	isBranchScreen: boolean,
	branchNavigatorKey?: string,
) => {
	AnimationStore.clear(routeKey);
	GestureStore.clear(routeKey);

	runOnUI(() => {
		"worklet";
		if (!isBranchScreen) return;

		BoundStore.clear(routeKey);

		if (branchNavigatorKey) {
			BoundStore.clearByBranch(branchNavigatorKey);
			return;
		}

		BoundStore.clearByAncestor(routeKey);
	})();
};
