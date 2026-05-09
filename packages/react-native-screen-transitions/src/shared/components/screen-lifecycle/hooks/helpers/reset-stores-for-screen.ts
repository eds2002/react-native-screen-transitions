import { runOnUI } from "react-native-reanimated";
import { AnimationStore } from "../../../../stores/animation.store";
import {
	clear,
	clearByAncestor,
	clearByBranch,
} from "../../../../stores/bounds/internals/clear";
import { GestureStore } from "../../../../stores/gesture.store";
import { ScrollStore } from "../../../../stores/scroll.store";
import { SystemStore } from "../../../../stores/system.store";

export function resetStoresForScreen(
	routeKey: string,
	isBranchScreen: boolean,
	branchNavigatorKey?: string,
) {
	AnimationStore.clearBag(routeKey);
	GestureStore.clearBag(routeKey);
	ScrollStore.clearBag(routeKey);
	SystemStore.clearBag(routeKey);

	runOnUI(() => {
		"worklet";
		if (!isBranchScreen) return;

		clear(routeKey);

		if (branchNavigatorKey) {
			clearByBranch(branchNavigatorKey);
			return;
		}

		clearByAncestor(routeKey);
	})();
}
