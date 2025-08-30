import {
	type MeasuredDimensions,
	makeMutable,
	type StyleProps,
} from "react-native-reanimated";
import type { ScreenTransitionState } from "../types/animation";
import type { ScreenKey } from "../types/navigator";
import type { Any } from "../types/utils";

type BoundsDict = Record<
	string,
	Record<string, { bounds: MeasuredDimensions; styles: StyleProps }>
>;

const registry = makeMutable<BoundsDict>({});
const activeBoundId = makeMutable<string | null>(null);
const lastActiveByRoute = makeMutable<Record<string, string>>({});
const pairHints = makeMutable<Record<string, string>>({});

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

function setTransitionHint(fromKey: string, toKey: string, boundId: string) {
	"worklet";
	const key = pairKey(fromKey, toKey);
	if (!key) return;
	pairHints.modify((state: Any) => {
		"worklet";
		state[key] = boundId;
		return state;
	});
}

function getTransitionHint(fromKey: string, toKey: string) {
	"worklet";
	const key = pairKey(fromKey, toKey);
	if (!key) return null;
	return pairHints.value[key] ?? null;
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

// Helpers for readability
function hasBound(s: ScreenTransitionState | undefined, id?: string | null) {
	"worklet";
	return !!id && !!s && !!s.bounds && !!s.bounds[id];
}

function keysOf(s: ScreenTransitionState | undefined) {
	"worklet";
	return Object.keys(s?.bounds || {});
}

function getRoutePair(
	current: ScreenTransitionState,
	next: ScreenTransitionState | undefined,
	previous: ScreenTransitionState | undefined,
) {
	"worklet";
	const isClosing = !!next;
	const fromKey = isClosing ? current.route.key : previous?.route.key;
	const toKey = isClosing ? next?.route.key : current.route.key;
	const other = next ?? previous;
	return { fromKey, toKey, other } as const;
}

function resolveFromHints(
	fromKey: string | undefined,
	toKey: string | undefined,
	other: ScreenTransitionState | undefined,
) {
	"worklet";
	if (fromKey && toKey) {
		const hinted = getTransitionHint(fromKey, toKey);
		if (hasBound(other, hinted)) return hinted as string;
	}
	return "";
}

function resolveFromRequested(
	reqId: string | null,
	current: ScreenTransitionState,
	other: ScreenTransitionState | undefined,
) {
	"worklet";
	const otherHasAny = !!other && keysOf(other).length > 0;
	if (hasBound(other, reqId)) return reqId as string;
	if (!otherHasAny && hasBound(current, reqId)) return reqId as string;
	return "";
}

function resolveFromSets(
	current: ScreenTransitionState,
	other: ScreenTransitionState | undefined,
	fromKey: string | undefined,
) {
	"worklet";
	if (!other) return "";
	const a = keysOf(current);
	const b = keysOf(other);
	const inter = a.filter((k) => b.includes(k));
	const otherHasAny = b.length > 0;
	const routeActive = fromKey ? getRouteActive(fromKey) : null;

	if (inter.length > 0) {
		if (routeActive && inter.includes(routeActive)) return routeActive;
		return inter[0];
	}

	if (routeActive && hasBound(other, routeActive)) return routeActive;
	if (b.length === 1) return b[0];

	if (!otherHasAny) {
		if (routeActive && hasBound(current, routeActive)) return routeActive;
		if (a.length === 1) return a[0];
	}

	return "";
}

function getActiveBound(
	current: ScreenTransitionState,
	next: ScreenTransitionState | undefined,
	previous: ScreenTransitionState | undefined,
) {
	"worklet";
	const requestedId = activeBoundId.value;
	const { fromKey, toKey, other } = getRoutePair(current, next, previous);

	// check last remembered hint
	const byHint = resolveFromHints(fromKey, toKey, other);
	if (byHint) {
		if (fromKey && toKey) setTransitionHint(fromKey, toKey, byHint);
		return byHint;
	}

	// check the active id
	const byRequested = resolveFromRequested(requestedId, current, other);
	if (byRequested) {
		if (fromKey && toKey) setTransitionHint(fromKey, toKey, byRequested);
		return byRequested;
	}

	// check the sets (intersection/MRU/fallbacks)
	const bySets = resolveFromSets(current, other, fromKey);
	if (bySets) {
		if (fromKey && toKey) setTransitionHint(fromKey, toKey, bySets);
		return bySets;
	}

	return "";
}

export const Bounds = {
	setBounds,
	getBounds,
	setActiveBoundId,
	getActiveBoundId,
	setRouteActive,
	getRouteActive,
	setTransitionHint,
	getTransitionHint,
	clear,
	clearActive,
	getActiveBound,
};
