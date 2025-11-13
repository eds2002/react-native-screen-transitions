import { makeMutable, type SharedValue } from "react-native-reanimated";
import type { ScreenKey } from "../types/core";

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

export function getAnimation(
	key: ScreenKey,
	type: "progress" | "closing" | "animating",
): SharedValue<number> {
	return ensure(key)[type];
}

export function getAll(key: ScreenKey) {
	return ensure(key);
}

function clear(routeKey: ScreenKey) {
	"worklet";
	delete store[routeKey];
}

export const AnimationStore = {
	getAnimation,
	clear,
	getAll,
};
