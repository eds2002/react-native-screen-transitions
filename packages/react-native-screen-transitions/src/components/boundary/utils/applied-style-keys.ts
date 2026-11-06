import { makeMutable } from "react-native-reanimated";

export type AppliedStyleKeys = Record<number, Record<string, true>>;

/**
 * The keys each boundary's animated style set last frame, by a per-style number. Reanimated leaves a
 * key that drops out of an animated style at its last value, so the style resets what it stops
 * setting. One map for every boundary (not a shared value each): only the UI thread writes it, in
 * place and without notifying, so no style re-runs because of it.
 */
export const appliedStyleKeys = makeMutable<AppliedStyleKeys>({});

let nextKey = 0;
export const nextAppliedStyleKey = () => ++nextKey;

export const forgetAppliedStyleKeys = (keys: readonly number[]) => {
	"worklet";
	appliedStyleKeys.modify((byStyle) => {
		"worklet";
		for (const key of keys) delete byStyle[key];
		return byStyle;
	}, false);
};
