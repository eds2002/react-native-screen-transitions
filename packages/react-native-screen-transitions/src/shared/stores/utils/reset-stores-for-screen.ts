import type { NativeStackDescriptor } from "../../../native-stack/types";
import { AnimationStore } from "../animation-store";
import { BoundStore } from "../bound-store";
import { GestureStore } from "../gesture-store";

/**
 * Reset all stores for a given screen
 */
export const resetStoresForScreen = (current: NativeStackDescriptor) => {
	AnimationStore.clear(current.route.key);
	GestureStore.clear(current.route.key);
	// BoundStore.clear(current.route.key);
};
