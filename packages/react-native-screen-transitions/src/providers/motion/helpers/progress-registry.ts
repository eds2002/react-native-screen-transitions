import { useLayoutEffect } from "react";
import { makeMutable, type SharedValue } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";

/**
 * Each mounted screen's visual progress (its transition with any drag applied), by route key,
 * readable from any worklet. A screen's frame only carries its stack neighbours, and those change
 * as routes leave (a screen closing under another closing screen stops being its `previous`); this
 * reads a screen's progress by key.
 */
type Entry = { progress: SharedValue<number>; closing: SharedValue<number> };
const screenProgress = makeMutable<Record<string, Entry>>({});

const register = (key: string, entry: Entry) => {
	"worklet";
	screenProgress.modify((state) => {
		"worklet";
		state[key] = entry;
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
