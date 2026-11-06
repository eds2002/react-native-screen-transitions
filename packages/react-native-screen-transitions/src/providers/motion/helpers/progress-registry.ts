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
	/** When it was mounted, relative to the others: a screen pushed later has a higher number. */
	order: number;
};
const screenProgress = makeMutable<Record<string, Entry>>({});
const mountCount = makeMutable(0);

const register = (
	key: string,
	entry: { progress: SharedValue<number>; closing: SharedValue<number> },
) => {
	"worklet";
	const order = mountCount.get() + 1;
	mountCount.set(order);
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
 * Whether `key` was mounted after `other` (a mounted screen). A screen not registered yet is newer
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
