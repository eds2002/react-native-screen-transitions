import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type { Layout, ScreenKey } from "../types/screen.types";

export type AnimationStoreMap = {
	progress: SharedValue<number>;
	animating: SharedValue<number>;
	closing: SharedValue<number>;
	entering: SharedValue<number>;
	targetProgress: SharedValue<number>;
	/** Resolved fraction (contentHeight / screenHeight) for the 'auto' snap point. -1 = not yet measured. */
	autoSnapPoint: SharedValue<number>;
	/** Intrinsic content layout measured from the screen container wrapper. */
	contentLayout: SharedValue<Layout | null>;
};

const store: Record<ScreenKey, AnimationStoreMap> = {};

function createAnimationBag(): AnimationStoreMap {
	return {
		progress: makeMutable(0),
		closing: makeMutable(0),
		animating: makeMutable(0),
		entering: makeMutable(0),
		targetProgress: makeMutable(1),
		autoSnapPoint: makeMutable(-1),
		contentLayout: makeMutable<Layout | null>(null),
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

function getRouteAnimation<K extends keyof AnimationStoreMap>(
	routeKey: ScreenKey,
	type: K,
): AnimationStoreMap[K] {
	return ensure(routeKey)[type];
}

function getAnimation<K extends keyof AnimationStoreMap>(
	routeKey: ScreenKey,
	type: K,
): AnimationStoreMap[K] {
	return getRouteAnimation(routeKey, type);
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
		cancelAnimation(bag.autoSnapPoint);
		cancelAnimation(bag.contentLayout);
	}
	delete store[routeKey];
}

export const AnimationStore = {
	getAnimation,
	peekRouteAnimations,
	getRouteAnimation,
	getRouteAnimations,
	clear,
};
