import { makeMutable, type SharedValue } from "react-native-reanimated";
import type { ScreenKey } from "../../types/navigator";

type AnimationMap = {
	progress: SharedValue<number>;
	closing: SharedValue<number>;
	animating: SharedValue<number>;
};

const store: Record<ScreenKey, AnimationMap> = {};

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

function clear(routeKey: ScreenKey) {
	"worklet";
	delete store[routeKey];
}

export const Animations = {
	getAnimation,
	clear,
};
