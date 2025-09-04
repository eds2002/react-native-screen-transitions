import type { ScreenTransitionState } from "../../types/animation";

type GetCache = (fromKey: string, toKey: string) => string | null;
type SetCache = (fromKey: string, toKey: string, id: string) => void;
type GetRouteActive = (routeKey: string) => string | null;

interface ResolveActiveBoundParams {
	current: ScreenTransitionState;
	next?: ScreenTransitionState;
	previous?: ScreenTransitionState;
	getPairCache: GetCache;
	setPairCache: SetCache;
	getRouteActive: GetRouteActive;
}

export function pairKey(fromKey?: string, toKey?: string) {
	"worklet";
	return fromKey && toKey ? `${fromKey}|${toKey}` : "";
}

const hasBound = (s: ScreenTransitionState | undefined, id?: string | null) => {
	"worklet";
	return !!id && !!s && !!s.bounds && !!s.bounds[id];
};

const getRoutePair = (
	current: ScreenTransitionState,
	next: ScreenTransitionState | undefined,
	previous: ScreenTransitionState | undefined,
) => {
	"worklet";
	const isClosing = !!next;
	const fromKey = isClosing ? current.route.key : previous?.route.key;
	const toKey = isClosing ? next?.route.key : current.route.key;
	const other = next ?? previous;
	return { fromKey, toKey, other } as const;
};

const resolveFromPairCache = (
	fromKey: string | undefined,
	toKey: string | undefined,
	other: ScreenTransitionState | undefined,
	getPairCache: GetCache,
) => {
	"worklet";
	if (fromKey && toKey) {
		const cached = getPairCache(fromKey, toKey);
		if (hasBound(other, cached)) return cached as string;
	}
	return "";
};

const resolveFromRequested = (
	reqId: string | null,
	current: ScreenTransitionState,
	other: ScreenTransitionState | undefined,
) => {
	"worklet";
	if (hasBound(other, reqId)) return reqId as string;
	if (hasBound(current, reqId)) return reqId as string;
	return "";
};

const resolveFromInteresection = (
	current: ScreenTransitionState,
	other: ScreenTransitionState | undefined,
	fromKey: string | undefined,
	getRouteActive: GetRouteActive,
) => {
	"worklet";
	if (!other) return "";
	const a = Object.keys(current.bounds);
	const b = Object.keys(other.bounds);
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
};

/**
 * Util function to get the active bound id for a given transition state.
 *
 * It will check by ( priority from highest to lowest ):
 * 1. Requested id
 * 2. Cache
 * 3. Intersection
 */
export function resolveActiveBound({
	current,
	next,
	previous,
	getPairCache,
	setPairCache,
	getRouteActive,
}: ResolveActiveBoundParams) {
	"worklet";
	const { fromKey, toKey, other } = getRoutePair(current, next, previous);

	// Resolve requested from per-route most recently used (last active bound by route)
	const requestedId = fromKey ? getRouteActive(fromKey) : null;
	const byRequested = resolveFromRequested(requestedId, current, other);
	if (byRequested) {
		if (
			fromKey &&
			toKey &&
			hasBound(current, byRequested) &&
			hasBound(other, byRequested)
		) {
			setPairCache(fromKey, toKey, byRequested);
		}
		return byRequested;
	}

	const byPairCache = resolveFromPairCache(fromKey, toKey, other, getPairCache);
	if (byPairCache) {
		if (
			fromKey &&
			toKey &&
			hasBound(current, byPairCache) &&
			hasBound(other, byPairCache)
		) {
			setPairCache(fromKey, toKey, byPairCache);
		}
		return byPairCache;
	}

	const byIntersection = resolveFromInteresection(
		current,
		other,
		fromKey,
		getRouteActive,
	);

	if (byIntersection) {
		if (
			fromKey &&
			toKey &&
			hasBound(current, byIntersection) &&
			hasBound(other, byIntersection)
		) {
			setPairCache(fromKey, toKey, byIntersection);
		}
		return byIntersection;
	}

	return "";
}
