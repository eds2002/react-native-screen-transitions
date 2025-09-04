import {
	type MeasuredDimensions,
	makeMutable,
	type StyleProps,
} from "react-native-reanimated";
import type { ScreenTransitionState } from "../../types/animation";
import type { ScreenKey } from "../../types/navigator";
import type { Any } from "../../types/utils";
import { resolveActiveBound } from "./_utils";

type BoundsDict = Record<
	string,
	Record<string, { bounds: MeasuredDimensions; styles: StyleProps }>
>;

const registry = makeMutable<BoundsDict>({});
const pairCache = makeMutable<Record<string, string>>({});
const activeBoundId = makeMutable<string | null>(null);
const lastActiveByRoute = makeMutable<Record<string, string>>({});

function pairKey(fromKey?: string, toKey?: string) {
	"worklet";
	return fromKey && toKey ? `${fromKey}|${toKey}` : "";
}

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

function setActiveBoundId(boundId: string) {
	"worklet";
	activeBoundId.value = boundId;
}

function getActiveBoundId() {
	"worklet";
	return activeBoundId.value;
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
	registry.modify((state: Any) => {
		"worklet";
		delete state[routeKey];
		return state;
	});
}

function clearActive() {
	"worklet";
	activeBoundId.value = null;
}

function getActiveBound(
	current: ScreenTransitionState,
	next: ScreenTransitionState | undefined,
	previous: ScreenTransitionState | undefined,
) {
	"worklet";
	const requestedId = activeBoundId.value;
	return resolveActiveBound({
		current,
		next,
		previous,
		requestedId,
		getPairCache,
		setPairCache,
		getRouteActive,
	});
}

export const Bounds = {
	setBounds,
	getBounds,
	setActiveBoundId,
	getActiveBoundId,
	setRouteActive,
	getRouteActive,
	clear,
	clearActive,
	getActiveBound,
};
