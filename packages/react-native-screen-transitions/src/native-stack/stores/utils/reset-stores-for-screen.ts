import type { NativeStackDescriptor } from "../../types/navigator";
import { Animations } from "../animations";
import { Bounds } from "../bounds";
import { Gestures } from "../gestures";

/**
 * Reset all stores for a given screen
 */
export const resetStoresForScreen = (current: NativeStackDescriptor) => {
	Animations.clear(current.route.key);
	Gestures.clear(current.route.key);
	Bounds.clear(current.route.key);
};
