import type { BoundsScreenNode, BoundsScreenState, ScreenKey } from "../types";
import { boundsScreens } from "./state";

const MAX_PARENT_DEPTH = 100;

export function registerBoundsScreen(
	screenKey: ScreenKey,
	node: BoundsScreenNode,
) {
	"worklet";
	boundsScreens.modify(<T extends BoundsScreenState>(state: T): T => {
		"worklet";
		(state as BoundsScreenState)[screenKey] = node;
		return state;
	});
}

export function unregisterBoundsScreen(screenKey: ScreenKey) {
	"worklet";
	boundsScreens.modify(<T extends BoundsScreenState>(state: T): T => {
		"worklet";
		delete (state as BoundsScreenState)[screenKey];
		return state;
	});
}

export function screenBelongsToScope(
	screenKey: ScreenKey,
	scopeScreenKey: ScreenKey,
): boolean {
	"worklet";
	if (screenKey === scopeScreenKey) return true;

	const screens = boundsScreens.get();
	let parentScreenKey = screens[screenKey]?.parentScreenKey;
	let depth = 0;

	while (parentScreenKey && depth < MAX_PARENT_DEPTH) {
		if (parentScreenKey === scopeScreenKey) return true;
		parentScreenKey = screens[parentScreenKey]?.parentScreenKey;
		depth += 1;
	}

	return false;
}
