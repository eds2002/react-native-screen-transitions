import { makeMutable, type SharedValue } from "react-native-reanimated";
import type { ScrollMetadataState } from "../../../types/gesture.types";
import type { ScreenTransform } from "../../../utils/bounds/helpers/screen-transform";

/**
 * Each mounted screen's content transform, by route key, readable from any worklet: a screen
 * outside the stack whose bounds share an element (a pair across stacks), and a measurement's
 * screen size. Never read from an interpolator: a screen's transform comes from its interpolator's
 * output, so that would make every screen's styles depend on each other's.
 */
const screenTransforms = makeMutable<
	Record<string, SharedValue<ScreenTransform>>
>({});

export const registerScreenTransform = (
	key: string,
	transform: SharedValue<ScreenTransform>,
) => {
	"worklet";
	screenTransforms.modify((state) => {
		"worklet";
		state[key] = transform;
		return state;
	});
};

export const unregisterScreenTransform = (
	key: string,
	transform: SharedValue<ScreenTransform>,
) => {
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

/**
 * Each mounted screen's scroll metadata, by route key, readable from any worklet: where the lists a
 * bounds element was measured in have scrolled since (applyBoundsScreenFrames). Read, not depended
 * on: a screen's styles must not re-run on every scroll of another screen. While a transition runs
 * its styles run every frame anyway, and the scroll event writes the metadata in the same frame.
 */
const screenScrolls = makeMutable<
	Record<string, SharedValue<ScrollMetadataState | null>>
>({});

export const registerScreenScroll = (
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

export const unregisterScreenScroll = (
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
