import { useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureStore } from "@/store/gesture-store";
import { ScreenProgressStore } from "@/store/screen-progress";
import { ConfigStore } from "../store/config-store";
import type {
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
} from "../types";
import { noopinterpolator } from "../utils/noop-interpolator";
import { useKey } from "./use-key";

interface InternalScreenInterpolationProps extends ScreenInterpolationProps {
	screenStyleInterpolator: ScreenStyleInterpolator;
}

const useAnimationBuilder = () => {
	const key = useKey();
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();

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

	const getAnimationValuesForScreen = useCallback(
		(screenId: string) => ({
			progress: ScreenProgressStore.getAllForScreen(screenId),
			gesture: GestureStore.getAllForScreen(screenId),
		}),
		[],
	);

	return useMemo(() => {
		return {
			current: getAnimationValuesForScreen(key),
			next: actualNextScreen
				? getAnimationValuesForScreen(actualNextScreen.id)
				: undefined,
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
	]);
};

const _useScreenAnimation = (): InternalScreenInterpolationProps => {
	return useAnimationBuilder();
};

const useScreenAnimation = (): ScreenInterpolationProps => {
	const { screenStyleInterpolator: _, ...animationProps } =
		useAnimationBuilder();

	return animationProps;
};

export { _useScreenAnimation, useScreenAnimation };
