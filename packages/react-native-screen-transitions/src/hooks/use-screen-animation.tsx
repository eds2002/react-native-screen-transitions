import { useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BoundStore } from "@/store/bound-store";
import { ConfigStore } from "@/store/config-store";
import { GestureStore } from "@/store/gesture-store";
import { ScreenProgressStore } from "@/store/screen-progress";
import type { BaseScreenInterpolationProps } from "@/types";
import type { _BaseScreenInterpolationProps } from "@/types/animation";
import { noopinterpolator } from "@/utils/noop-interpolator";
import { useKey } from "./use-key";

const useAnimationBuilder = () => {
	const key = useKey();
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();

	/**
	 * NOTE:
	 * Should previous screens also be wary of their navigators? Next uses logic to see if it should animate or not based on the navigator, current and next will be the only ones used for screen transitions, previous will ideally only be used for bounds? Come back to this
	 */
	const previousScreen = ConfigStore.use(
		useCallback(
			(state) => {
				const current = state.screens[key];
				if (!current) return undefined;

				const previousKey = state.screenKeys[current.index - 1];
				return previousKey ? state.screens[previousKey] : undefined;
			},
			[key],
		),
	);

	const currentScreen = ConfigStore.use(
		useCallback((state) => state.screens[key], [key]),
	);

	const actualNextScreen = ConfigStore.use(
		useCallback(
			(state) => {
				const current = state.screens[key];
				if (!current) return undefined;

				const nextKey = state.screenKeys[current.index + 1];
				const nextScreen = nextKey ? state.screens[nextKey] : undefined;

				const shouldUseNext =
					nextScreen?.navigatorKey === current?.navigatorKey;
				return shouldUseNext ? nextScreen : undefined;
			},
			[key],
		),
	);

	const getAnimationValuesForScreen = useCallback((screenId: string) => {
		const progress = ScreenProgressStore.getAllForScreen(screenId);
		const gesture = GestureStore.getAllForScreen(screenId);
		const bounds = BoundStore.getScreenBounds(screenId);

		return {
			progress,
			gesture,
			bounds,
		};
	}, []);

	return useMemo(() => {
		const current = getAnimationValuesForScreen(key);
		const next = actualNextScreen
			? getAnimationValuesForScreen(actualNextScreen.id)
			: undefined;

		return {
			previous: previousScreen
				? getAnimationValuesForScreen(previousScreen.id)
				: undefined,
			current,
			next,
			layouts: { screen: dimensions },

			insets,
			closing: currentScreen?.closing || false,
			screenStyleInterpolator:
				actualNextScreen?.screenStyleInterpolator ||
				currentScreen?.screenStyleInterpolator ||
				noopinterpolator,
		};
	}, [
		key,
		currentScreen,
		actualNextScreen,
		dimensions,
		insets,
		getAnimationValuesForScreen,
		previousScreen,
	]);
};

const _useScreenAnimation = (): _BaseScreenInterpolationProps => {
	return useAnimationBuilder();
};

const useScreenAnimation = (): BaseScreenInterpolationProps => {
	const { screenStyleInterpolator: _, ...animationProps } =
		useAnimationBuilder();

	return animationProps;
};

export { _useScreenAnimation, useScreenAnimation };
