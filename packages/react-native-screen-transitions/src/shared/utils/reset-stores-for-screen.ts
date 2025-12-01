import type { TransitionDescriptor } from "../providers/keys.provider";
import { AnimationStore } from "../stores/animation.store";
import { GestureStore } from "../stores/gesture.store";

/**
 * Reset all stores for a given screen
 */
export const resetStoresForScreen = (current: TransitionDescriptor) => {
	AnimationStore.clear(current.route.key);
	GestureStore.clear(current.route.key);
};
