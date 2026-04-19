import { runOnUI } from "react-native-reanimated";
import { AnimationStore } from "../../../../stores/animation.store";
import { BoundStore } from "../../../../stores/bounds";
import { GestureStore } from "../../../../stores/gesture.store";
import { SystemStore } from "../../../../stores/system.store";

export function resetStoresForScreen(
	routeKey: string,
	isBranchScreen: boolean,
	branchNavigatorKey?: string,
) {
	AnimationStore.clearBag(routeKey);
	GestureStore.clearBag(routeKey);
	SystemStore.clearBag(routeKey);

	runOnUI(() => {
		"worklet";
		if (!isBranchScreen) return;

		BoundStore.cleanup.byScreen(routeKey);

		if (branchNavigatorKey) {
			BoundStore.cleanup.byBranch(branchNavigatorKey);
			return;
		}

		BoundStore.cleanup.byAncestor(routeKey);
	})();
}
