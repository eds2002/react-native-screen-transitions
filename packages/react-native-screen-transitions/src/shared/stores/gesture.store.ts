import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type { GestureDirection } from "../types/gesture.types";
import type { ScreenKey } from "../types/screen.types";

type GestureKey =
	| "x"
	| "y"
	| "normalizedX"
	| "normalizedY"
	| "isDismissing"
	| "isDragging";

export type GestureStoreMap = {
	x: SharedValue<number>;
	y: SharedValue<number>;
	normalizedX: SharedValue<number>;
	normalizedY: SharedValue<number>;
	isDismissing: SharedValue<number>;
	isDragging: SharedValue<number>;
	direction: SharedValue<Omit<GestureDirection, "bidirectional"> | null>;
};

const store: Record<ScreenKey, GestureStoreMap> = {};

function ensure(routeKey: ScreenKey): GestureStoreMap {
	let bag = store[routeKey];
	if (!bag) {
		bag = {
			x: makeMutable(0),
			y: makeMutable(0),
			normalizedX: makeMutable(0),
			normalizedY: makeMutable(0),
			isDismissing: makeMutable(0),
			isDragging: makeMutable(0),
			direction: makeMutable<Omit<GestureDirection, "bidirectional"> | null>(
				null,
			),
		};
		store[routeKey] = bag;
	}
	return bag;
}

function getGesture(routeKey: ScreenKey, gestureKey: GestureKey) {
	return ensure(routeKey)[gestureKey];
}

function getRouteGestures(routeKey: ScreenKey) {
	return ensure(routeKey);
}

function clear(routeKey: ScreenKey) {
	const bag = store[routeKey];
	if (bag) {
		cancelAnimation(bag.x);
		cancelAnimation(bag.y);
		cancelAnimation(bag.normalizedX);
		cancelAnimation(bag.normalizedY);
		cancelAnimation(bag.isDismissing);
		cancelAnimation(bag.isDragging);
		cancelAnimation(bag.direction);
	}
	delete store[routeKey];
}

export const GestureStore = {
	getGesture,
	getRouteGestures,
	clear,
};
