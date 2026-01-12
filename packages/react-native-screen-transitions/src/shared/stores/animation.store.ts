import { makeMutable, type SharedValue } from "react-native-reanimated";
import type { ScreenKey } from "../types/screen.types";

export type AnimationStoreMap = {
	progress: SharedValue<number>;
	animating: SharedValue<number>;
	closing: SharedValue<number>;
	entering: SharedValue<number>;
	settled: SharedValue<number>;
};

const store: Record<ScreenKey, AnimationStoreMap> = {};

const ensure = (key: ScreenKey) => {
	let bag = store[key];
	if (!bag) {
		bag = {
			progress: makeMutable(0),
			closing: makeMutable(0),
			animating: makeMutable(0),
			entering: makeMutable(1),
			settled: makeMutable(0),
		} satisfies AnimationStoreMap;
		store[key] = bag;
	}
	return bag;
};

function getAnimation(
	key: ScreenKey,
	type: keyof AnimationStoreMap,
): SharedValue<number> {
	return ensure(key)[type];
}

function getAll(key: ScreenKey) {
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
