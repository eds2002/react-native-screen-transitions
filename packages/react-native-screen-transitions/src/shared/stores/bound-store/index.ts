import {
	type MeasuredDimensions,
	makeMutable,
	type StyleProps,
} from "react-native-reanimated";
import type { ScreenTransitionState } from "../../types/animation";
import type { ScreenKey } from "../../types/core";
import type { Any } from "../../types/utils";
import { pairKey, resolveActiveBound } from "./_utils";

type BoundsDict = Record<
	string,
	Record<string, { bounds: MeasuredDimensions; styles: StyleProps }>
>;

const registry = makeMutable<BoundsDict>({});
const pairCache = makeMutable<Record<string, string>>({});
const lastActiveByRoute = makeMutable<Record<string, string>>({});

function setBounds(
	screenId: string,
	boundId: string,
	bounds: MeasuredDimensions | null = null,
	styles: StyleProps = {},
) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		if (!state[screenId]) {
			state[screenId] = {};
		}
		state[screenId][boundId] = { bounds, styles };

		return state;
	});
}

function getBounds(screenId: string) {
	"worklet";
	return registry.value[screenId] ?? {};
}

function setRouteActive(routeKey: string, boundId: string) {
	"worklet";
	lastActiveByRoute.modify((state: Any) => {
		"worklet";
		state[routeKey] = boundId;
		return state;
	});
}

function getRouteActive(routeKey: string) {
	"worklet";
	return lastActiveByRoute.value[routeKey] ?? null;
}

function setPairCache(fromKey: string, toKey: string, boundId: string) {
	"worklet";
	const key = pairKey(fromKey, toKey);
	if (!key) return;
	pairCache.modify((state: Any) => {
		"worklet";
		state[key] = boundId;
		return state;
	});
}

function getPairCache(fromKey: string, toKey: string) {
	"worklet";
	const key = pairKey(fromKey, toKey);
	if (!key) return null;
	return pairCache.value[key] ?? null;
}

function clear(routeKey: ScreenKey) {
	"worklet";
	registry.modify((state) => {
		"worklet";
		delete state[routeKey];
		return state;
	});
	lastActiveByRoute.modify((state) => {
		"worklet";
		if (state[routeKey]) delete state[routeKey];
		return state;
	});

	pairCache.modify((state) => {
		"worklet";
		const keys = Object.keys(state);
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i];
			const [from, to] = k.split("|");
			if (from === routeKey || to === routeKey) {
				delete state[k];
			}
		}
		return state;
	});
}

function debugBoundStore() {
	"worklet";
	console.log("[BoundStore] registry keys:", Object.keys(registry.value));
	console.log(
		"[BoundStore] registry size:",
		Object.keys(registry.value).length,
	);
	console.log("[BoundStore] pairCache keys:", Object.keys(pairCache.value));
	console.log(
		"[BoundStore] pairCache size:",
		Object.keys(pairCache.value).length,
	);
	console.log(
		"[BoundStore] lastActiveByRoute keys:",
		Object.keys(lastActiveByRoute.value),
	);
	console.log(
		"[BoundStore] lastActiveByRoute size:",
		Object.keys(lastActiveByRoute.value).length,
	);
}

function getActiveBound(
	current: ScreenTransitionState,
	next: ScreenTransitionState | undefined,
	previous: ScreenTransitionState | undefined,
) {
	"worklet";
	return resolveActiveBound({
		current,
		next,
		previous,
		getPairCache,
		setPairCache,
		getRouteActive,
	});
}

export const BoundStore = {
	setBounds,
	getBounds,
	setRouteActive,
	getRouteActive,
	clear,
	getActiveBound,
	debugBoundStore,
};
