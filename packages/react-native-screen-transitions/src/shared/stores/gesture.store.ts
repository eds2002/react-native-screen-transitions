import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type { GestureDirection } from "../types/gesture.types";
import { createStore } from "./create-store";

export type GestureStoreMap = {
	x: SharedValue<number>;
	y: SharedValue<number>;
	normX: SharedValue<number>;
	normY: SharedValue<number>;
	dismissing: SharedValue<number>;
	dragging: SharedValue<number>;
	direction: SharedValue<Omit<GestureDirection, "bidirectional"> | null>;

	/**
	 * @deprecated Use `normX` instead.
	 */
	normalizedX: SharedValue<number>;
	/**
	 * @deprecated Use `normY` instead.
	 */
	normalizedY: SharedValue<number>;
	/**
	 * @deprecated Use `dismissing` instead.
	 */
	isDismissing: SharedValue<number>;
	/**
	 * @deprecated Use `dragging` instead.
	 */
	isDragging: SharedValue<number>;
};

function createGestureBag(): GestureStoreMap {
	const normX = makeMutable(0);
	const normY = makeMutable(0);
	const dismissing = makeMutable(0);
	const dragging = makeMutable(0);

	return {
		x: makeMutable(0),
		y: makeMutable(0),
		normX,
		normY,
		dismissing,
		dragging,
		direction: makeMutable<Omit<GestureDirection, "bidirectional"> | null>(
			null,
		),

		// Deprecated aliases (same underlying SharedValue)
		normalizedX: normX,
		normalizedY: normY,
		isDismissing: dismissing,
		isDragging: dragging,
	};
}

/**
 * Route-keyed gesture state used by the transition system while a screen is
 * being dragged or dismissed. It stores raw and normalized gesture values,
 * dismissal flags, and the active gesture direction. `getCachedBag()` provides
 * a stable neutral fallback bag for cases where a route should not own live
 * gesture state.
 */
export const GestureStore = createStore<GestureStoreMap>({
	createBag: createGestureBag,
	disposeBag: (bag) => {
		cancelAnimation(bag.x);
		cancelAnimation(bag.y);
		cancelAnimation(bag.normX);
		cancelAnimation(bag.normY);
		cancelAnimation(bag.dismissing);
		cancelAnimation(bag.dragging);
		cancelAnimation(bag.direction);
	},
});
