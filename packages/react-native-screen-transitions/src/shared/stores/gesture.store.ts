import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type { PanGestureDirection } from "../types/gesture.types";
import { createStore } from "../utils/create-store";

export type GestureStoreMap = {
	x: SharedValue<number>;
	y: SharedValue<number>;
	normX: SharedValue<number>;
	normY: SharedValue<number>;
	scale: SharedValue<number>;
	normScale: SharedValue<number>;
	focalX: SharedValue<number>;
	focalY: SharedValue<number>;
	dismissing: SharedValue<number>;
	dragging: SharedValue<number>;
	direction: SharedValue<Omit<PanGestureDirection, "bidirectional"> | null>;
};

function createGestureBag(): GestureStoreMap {
	const normX = makeMutable(0);
	const normY = makeMutable(0);
	const scale = makeMutable(1);
	const normScale = makeMutable(0);
	const dismissing = makeMutable(0);
	const dragging = makeMutable(0);

	return {
		x: makeMutable(0),
		y: makeMutable(0),
		normX,
		normY,
		scale,
		normScale,
		focalX: makeMutable(0),
		focalY: makeMutable(0),
		dismissing,
		dragging,
		direction: makeMutable<Omit<PanGestureDirection, "bidirectional"> | null>(
			null,
		),
	};
}

/**
 * Route-keyed gesture state used by the transition system while a screen is
 * being dragged or dismissed. It stores the effective gesture values exposed
 * to interpolators, dismissal flags, and the active gesture direction.
 * `getCachedBag()` provides a stable neutral fallback bag for cases where a
 * route should not own live gesture state.
 */
export const GestureStore = createStore<GestureStoreMap>({
	createBag: createGestureBag,
	disposeBag: (bag) => {
		cancelAnimation(bag.x);
		cancelAnimation(bag.y);
		cancelAnimation(bag.normX);
		cancelAnimation(bag.normY);
		cancelAnimation(bag.scale);
		cancelAnimation(bag.normScale);
		cancelAnimation(bag.focalX);
		cancelAnimation(bag.focalY);
		cancelAnimation(bag.dismissing);
		cancelAnimation(bag.dragging);
		cancelAnimation(bag.direction);
	},
});
