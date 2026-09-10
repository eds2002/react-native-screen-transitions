import { scheduleOnUI } from "react-native-worklets";
import { clear } from "../../../../../stores/bounds/internals/clear";
import { ScrollStore } from "../../../../../stores/scroll.store";

export function resetStoresForScreen(routeKey: string) {
	ScrollStore.clearBag(routeKey);

	scheduleOnUI(clear, routeKey);
}
