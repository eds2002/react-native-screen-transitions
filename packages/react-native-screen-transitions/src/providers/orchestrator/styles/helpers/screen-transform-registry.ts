import { useLayoutEffect } from "react";
import { makeMutable, type SharedValue } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import type { ScrollMetadataState } from "../../../../types/gesture.types";
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

/**
 * Each mounted screen's scroll metadata, by route key, readable from any worklet: where the lists a
 * bounds element was measured in have scrolled since (applyBoundsScreenFrames). Read, not depended
 * on: a screen's styles must not re-run on every scroll of another screen. While a transition runs
 * its styles run every frame anyway, and the scroll event writes the metadata in the same frame.
 */
const screenScrolls = makeMutable<
	Record<string, SharedValue<ScrollMetadataState | null>>
>({});

const registerScroll = (
	key: string,
	scroll: SharedValue<ScrollMetadataState | null>,
) => {
	"worklet";
	screenScrolls.modify((state) => {
		"worklet";
		state[key] = scroll;
		return state;
	});
};

const unregisterScroll = (
	key: string,
	scroll: SharedValue<ScrollMetadataState | null>,
) => {
	"worklet";
	screenScrolls.modify((state) => {
		"worklet";
		if (state[key] === scroll) delete state[key];
		return state;
	});
};

export const getScreenScroll = (
	key: string,
): ScrollMetadataState | null | undefined => {
	"worklet";
	return screenScrolls.get()[key]?.get();
};

export function useRegisterScreenScroll(
	key: string,
	scroll: SharedValue<ScrollMetadataState | null>,
	enabled: boolean,
) {
	useLayoutEffect(() => {
		if (!enabled) return;
		scheduleOnUI(registerScroll, key, scroll);
		return () => scheduleOnUI(unregisterScroll, key, scroll);
	}, [key, scroll, enabled]);
}
