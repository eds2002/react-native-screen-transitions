import type { TransitionDescriptor } from "../providers/keys.provider";
import { AnimationStore } from "../stores/animation.store";
import { BoundStore } from "../stores/bounds.store";
import { GestureStore } from "../stores/gesture.store";

/**
 * Reset all stores for a given screen
 */
export const resetStoresForScreen = (current: TransitionDescriptor) => {
	AnimationStore.clear(current.route.key);
	GestureStore.clear(current.route.key);
	BoundStore.clear(current.route.key);
};
