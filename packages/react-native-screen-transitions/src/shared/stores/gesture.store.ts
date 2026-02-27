import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type { GestureDirection } from "../types/gesture.types";
import type { ScreenKey } from "../types/screen.types";

export type GestureStoreMap = {
	x: SharedValue<number>;
	y: SharedValue<number>;
	normX: SharedValue<number>;
	normY: SharedValue<number>;
	dismissing: SharedValue<number>;
	dragging: SharedValue<number>;
	direction: SharedValue<Omit<GestureDirection, "bidirectional"> | null>;

	/** @deprecated Use `normX` instead. */
	normalizedX: SharedValue<number>;
	/** @deprecated Use `normY` instead. */
	normalizedY: SharedValue<number>;
	/** @deprecated Use `dismissing` instead. */
	isDismissing: SharedValue<number>;
	/** @deprecated Use `dragging` instead. */
	isDragging: SharedValue<number>;
};

const store: Record<ScreenKey, GestureStoreMap> = {};
let neutralGestures: GestureStoreMap | undefined;

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

function ensure(routeKey: ScreenKey): GestureStoreMap {
	let bag = store[routeKey];
	if (!bag) {
		bag = createGestureBag();
		store[routeKey] = bag;
	}
	return bag;
}

function peekRouteGestures(routeKey: ScreenKey): GestureStoreMap | undefined {
	return store[routeKey];
}

function getRouteGestures(routeKey: ScreenKey) {
	return ensure(routeKey);
}

function getNeutralGestures(): GestureStoreMap {
	if (!neutralGestures) {
		neutralGestures = createGestureBag();
	}
	return neutralGestures;
}

function clear(routeKey: ScreenKey) {
	const bag = store[routeKey];
	if (bag) {
		cancelAnimation(bag.x);
		cancelAnimation(bag.y);
		cancelAnimation(bag.normX);
		cancelAnimation(bag.normY);
		cancelAnimation(bag.dismissing);
		cancelAnimation(bag.dragging);
		cancelAnimation(bag.direction);
	}
	delete store[routeKey];
}

export const GestureStore = {
	peekRouteGestures,
	getRouteGestures,
	getNeutralGestures,
	clear,
};
