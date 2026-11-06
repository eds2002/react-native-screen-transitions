import { useLayoutEffect } from "react";
import {
	makeMutable,
	type SharedValue,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import type { ScreenTransform } from "./bounds-screen-frames";

/**
 * Each mounted screen's content transform, by route key, readable from any worklet: where a pair's
 * element is drawn (a sibling in flight, a chain) and a screen outside a stack's neighbours. A
 * snapshot, published once the screen's styles resolve: reading the live value from an interpolator
 * would make every screen's styles depend on each other's (a cycle).
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

const UNMOVED: ScreenTransform = {
	sx: 1,
	sy: 1,
	tx: 0,
	ty: 0,
	width: 0,
	height: 0,
};

export function useRegisterScreenTransform(
	key: string,
	transform: SharedValue<ScreenTransform>,
	enabled: boolean,
) {
	const snapshot = useSharedValue<ScreenTransform>(UNMOVED);
	useAnimatedReaction(
		() => transform.get(),
		(next) => {
			if (snapshot.get() !== next) snapshot.set(next);
		},
	);
	useLayoutEffect(() => {
		if (!enabled) return;
		scheduleOnUI(register, key, snapshot);
		return () => scheduleOnUI(unregister, key, snapshot);
	}, [key, snapshot, enabled]);
}
