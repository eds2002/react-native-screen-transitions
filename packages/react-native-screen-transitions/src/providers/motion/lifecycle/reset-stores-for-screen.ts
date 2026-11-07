import { scheduleOnUI } from "react-native-worklets";
import { clearScreenBounds as clear } from "../../../stores/bounds";
import { ScrollStore } from "../../../stores/scroll.store";

export function resetStoresForScreen(routeKey: string) {
	ScrollStore.clearBag(routeKey);

	scheduleOnUI(clear, routeKey);
}
