import type { NativeStackDescriptor } from "../../types/navigator";
import { Animations } from "../animations";
import { Bounds } from "../bounds";
import { Gestures } from "../gestures";

/**
 * Reset all stores for a given screen
 */
export const resetStoresForScreen = (
	current: NativeStackDescriptor,
	options: { clearActive?: boolean } = {},
) => {
	Animations.clear(current.route.key);
	Gestures.clear(current.route.key);
	Bounds.clear(current.route.key);
	if (options.clearActive) {
		Bounds.clearActive();
	}
};
