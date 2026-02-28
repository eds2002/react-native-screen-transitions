import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type { ScreenKey } from "../types/screen.types";

export type AnimationStoreMap = {
	progress: SharedValue<number>;
	animating: SharedValue<number>;
	closing: SharedValue<number>;
	entering: SharedValue<number>;
	targetProgress: SharedValue<number>;
};

const store: Record<ScreenKey, AnimationStoreMap> = {};

function createAnimationBag(): AnimationStoreMap {
	return {
		progress: makeMutable(0),
		closing: makeMutable(0),
		animating: makeMutable(0),
		entering: makeMutable(1),
		targetProgress: makeMutable(1),
	};
}

function ensure(routeKey: ScreenKey): AnimationStoreMap {
	let bag = store[routeKey];
	if (!bag) {
		bag = createAnimationBag();
		store[routeKey] = bag;
	}
	return bag;
}

function peekRouteAnimations(
	routeKey: ScreenKey,
): AnimationStoreMap | undefined {
	return store[routeKey];
}

function getRouteAnimation(
	routeKey: ScreenKey,
	type: keyof AnimationStoreMap,
): SharedValue<number> {
	return ensure(routeKey)[type];
}

function getRouteAnimations(routeKey: ScreenKey): AnimationStoreMap {
	return ensure(routeKey);
}

function clear(routeKey: ScreenKey) {
	const bag = store[routeKey];
	if (bag) {
		cancelAnimation(bag.progress);
		cancelAnimation(bag.animating);
		cancelAnimation(bag.closing);
		cancelAnimation(bag.entering);
		cancelAnimation(bag.targetProgress);
	}
	delete store[routeKey];
}

export const AnimationStore = {
	peekRouteAnimations,
	getRouteAnimation,
	getRouteAnimations,
	clear,
};
