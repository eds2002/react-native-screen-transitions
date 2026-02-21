import { AnimationStore } from "../../../../stores/animation.store";
import { BoundStore } from "../../../../stores/bounds.store";
import { GestureStore } from "../../../../stores/gesture.store";
import type { BaseStackDescriptor } from "../../../../types/stack.types";

/**
 * Reset all stores for a given screen.
 * Accepts any descriptor that has a route with a key.
 */
export const resetStoresForScreen = (current: BaseStackDescriptor) => {
	AnimationStore.clear(current.route.key);
	GestureStore.clear(current.route.key);
	BoundStore.clear(current.route.key);
};
