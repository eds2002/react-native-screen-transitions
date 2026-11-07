import { useLayoutEffect } from "react";
import { makeMutable, type SharedValue } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";

/**
 * Each mounted screen's visual progress (its transition with any drag applied), by route key,
 * readable from any worklet. A screen's frame only carries its stack neighbours, and those change
 * as routes leave (a screen closing under another closing screen stops being its `previous`); this
 * reads a screen's progress by key.
 */
type Entry = {
	progress: SharedValue<number>;
	closing: SharedValue<number>;
	/** When it was pushed, relative to the others: a screen pushed later has a higher number. */
	order: number;
};
const screenProgress = makeMutable<Record<string, Entry>>({});
const mountCount = makeMutable(0);
/**
 * The order each route key first registered with, kept across remounts: a screen deep in the stack
 * unmounts its motion while covered and registers again as the screens above it close, and it must
 * not become "newer" than them (route keys are unique per push, so the first registration is the
 * push). Bounded: past MAX_ORDERS the oldest keys that are not mounted are forgotten.
 */
const firstOrders = makeMutable<Record<string, number>>({});
const MAX_ORDERS = 500;

const register = (
	key: string,
	entry: { progress: SharedValue<number>; closing: SharedValue<number> },
) => {
	"worklet";
	const known = firstOrders.get()[key];
	const order = known ?? mountCount.get() + 1;
	if (known === undefined) {
		mountCount.set(order);
		firstOrders.modify((orders) => {
			"worklet";
			orders[key] = order;
			const keys = Object.keys(orders);
			if (keys.length > MAX_ORDERS) {
				const mounted = screenProgress.get();
				keys.sort((a, b) => orders[a] - orders[b]);
				for (let i = 0; i < keys.length - MAX_ORDERS; i++) {
					if (!mounted[keys[i]]) delete orders[keys[i]];
				}
			}
			return orders;
		});
	}
	screenProgress.modify((state) => {
		"worklet";
		state[key] = { ...entry, order };
		return state;
	});
};

const unregister = (key: string, progress: SharedValue<number>) => {
	"worklet";
	screenProgress.modify((state) => {
		"worklet";
		// Only the registration that is leaving: a remount with the same key may already be in.
		if (state[key]?.progress === progress) delete state[key];
		return state;
	});
};

export const getScreenProgress = (key: string): number | undefined => {
	"worklet";
	return screenProgress.get()[key]?.progress.get();
};

/** When `key` was mounted relative to other screens (higher is later), or 0 when it is not. */
export const getScreenMountOrder = (key: string): number => {
	"worklet";
	return screenProgress.get()[key]?.order ?? 0;
};

/**
 * Whether `key` was pushed after `other` (a mounted screen). A screen not registered yet is newer
 * than every registered one: it registers a frame after it mounts, and its first frame already
 * transitions (a screen just pushed over one still closing).
 */
export const isScreenNewer = (key: string, other: string): boolean => {
	"worklet";
	const state = screenProgress.get();
	const a = state[key];
	const b = state[other];
	if (!b) return false;
	return !a || a.order > b.order;
};

export const isScreenClosing = (key: string): boolean => {
	"worklet";
	return !!screenProgress.get()[key]?.closing.get();
};

export function useRegisterScreenProgress(
	key: string,
	progress: SharedValue<number>,
	closing: SharedValue<number>,
) {
	useLayoutEffect(() => {
		scheduleOnUI(register, key, { progress, closing });
		return () => scheduleOnUI(unregister, key, progress);
	}, [key, progress, closing]);
}
