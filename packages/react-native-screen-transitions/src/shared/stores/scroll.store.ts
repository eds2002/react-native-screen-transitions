import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type { ScrollGestureState } from "../types/gesture.types";
import { createStore } from "../utils/create-store";

export type ScrollStoreMap = {
	state: SharedValue<ScrollGestureState | null>;
};

/**
 * Route-keyed scroll geometry used by gesture activation and bounds measurement.
 * The state tracks coordinated ScrollView offsets and dimensions so consumers
 * can reason about overscroll without coupling to a specific scroll component.
 */
export const ScrollStore = createStore<ScrollStoreMap>({
	createBag: () => ({
		state: makeMutable<ScrollGestureState | null>(null),
	}),
	disposeBag: (bag) => {
		cancelAnimation(bag.state);
	},
});
