import { useLayoutEffect } from "react";
import { makeMutable, type SharedValue } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import type { ScreenTransform } from "./bounds-screen-frames";

/**
 * Each mounted screen's content transform, by route key, readable from any worklet: a screen
 * outside the stack whose bounds share an element (a pair across stacks), and a measurement's
 * screen size. Never read from an interpolator: a screen's transform comes from its interpolator's
 * output, so that would make every screen's styles depend on each other's.
 */
const screenTransforms = makeMutable<
	Record<string, SharedValue<ScreenTransform>>
>({});

const register = (key: string, transform: SharedValue<ScreenTransform>) => {
	"worklet";
	screenTransforms.modify((state) => {
		"worklet";
		state[key] = transform;
		return state;
	});
};

const unregister = (key: string, transform: SharedValue<ScreenTransform>) => {
	"worklet";
	screenTransforms.modify((state) => {
		"worklet";
		// Only the registration that is leaving: a remount with the same key may already be in.
		if (state[key] === transform) delete state[key];
		return state;
	});
};

export const getScreenTransform = (
	key: string,
): ScreenTransform | undefined => {
	"worklet";
	return screenTransforms.get()[key]?.get();
};

export function useRegisterScreenTransform(
	key: string,
	transform: SharedValue<ScreenTransform>,
	enabled: boolean,
) {
	useLayoutEffect(() => {
		if (!enabled) return;
		scheduleOnUI(register, key, transform);
		return () => scheduleOnUI(unregister, key, transform);
	}, [key, transform, enabled]);
}
