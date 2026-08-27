import { scheduleOnUI } from "react-native-worklets";
import { AnimationStore } from "../../../../stores/animation.store";
import { clear } from "../../../../stores/bounds/internals/clear";
import { GestureStore } from "../../../../stores/gesture.store";
import { ScrollStore } from "../../../../stores/scroll.store";
import { SystemStore } from "../../../../stores/system.store";

export function resetStoresForScreen(routeKey: string) {
	AnimationStore.clearBag(routeKey);
	GestureStore.clearBag(routeKey);
	ScrollStore.clearBag(routeKey);
	SystemStore.clearBag(routeKey);

	scheduleOnUI(clear, routeKey);
}
