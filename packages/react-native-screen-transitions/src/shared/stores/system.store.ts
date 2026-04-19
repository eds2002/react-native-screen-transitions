import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type { Layout } from "../types/screen.types";
import { createStore } from "../utils/create-store";

export type SystemStoreMap = {
	targetProgress: SharedValue<number>;

	/**
	 * Resolved fraction (contentHeight / screenHeight) for the 'auto' snap point. -1 = not yet measured.
	 */
	resolvedAutoSnapPoint: SharedValue<number>;

	/**
	 * Intrinsic measured content layout from the screen container wrapper.
	 */
	measuredContentLayout: SharedValue<Layout | null>;
};

function createSystemBag(): SystemStoreMap {
	return {
		targetProgress: makeMutable(1),
		resolvedAutoSnapPoint: makeMutable(-1),
		measuredContentLayout: makeMutable<Layout | null>(null),
	};
}

/**
 * Route-keyed internal engine state that should not be treated as public screen
 * animation data. These values support runtime measurement and orchestration,
 * such as resolved auto snap points, measured content layout, and the current
 * animation target progress. This could possibly grow in the future.
 */
export const SystemStore = createStore<SystemStoreMap>({
	createBag: createSystemBag,
	disposeBag: (bag) => {
		cancelAnimation(bag.targetProgress);
		cancelAnimation(bag.resolvedAutoSnapPoint);
		cancelAnimation(bag.measuredContentLayout);
	},
});
