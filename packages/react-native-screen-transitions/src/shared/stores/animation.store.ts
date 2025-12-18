import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type { ScreenKey } from "../types/screen.types";

export type AnimationStoreMap = {
	progress: SharedValue<number>;
	closing: SharedValue<number>;
	animating: SharedValue<number>;
};

const store: Record<ScreenKey, AnimationStoreMap> = {};

const ensure = (key: ScreenKey) => {
	let bag = store[key];
	if (!bag) {
		bag = {
			progress: makeMutable(0),
			closing: makeMutable(0),
			animating: makeMutable(0),
		};
		store[key] = bag;
	}
	return bag;
};

function getAnimation(
	key: ScreenKey,
	type: "progress" | "closing" | "animating",
): SharedValue<number> {
	return ensure(key)[type];
}

function getAll(key: ScreenKey) {
	return ensure(key);
}

function clear(routeKey: ScreenKey) {
	"worklet";
	const bag = store[routeKey];
	if (bag) {
		cancelAnimation(bag.progress);
		cancelAnimation(bag.closing);
		cancelAnimation(bag.animating);
	}
	delete store[routeKey];
}

function debugStoreSize() {
	console.log("[AnimationStore] Size:", Object.keys(store).length);
	console.log("[AnimationStore] Keys:", Object.keys(store));
}

export const AnimationStore = {
	getAnimation,
	clear,
	getAll,
	debugStoreSize,
};
