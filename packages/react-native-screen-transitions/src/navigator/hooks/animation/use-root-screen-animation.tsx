import { useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScreenKeys } from "@/navigator/contexts/screen-keys";
import { BoundStore } from "@/store/bound-store";
import { ConfigStore } from "@/store/config-store";
import { GestureStore } from "@/store/gesture-store";
import { ScreenProgressStore } from "@/store/screen-progress";
import type {
	_BaseScreenInterpolationProps,
	BaseScreenInterpolationProps,
	ScreenInterpolationProps,
	ScreenProgress,
} from "@/types/animation";
import { ScreenInterpolatorState } from "@/types/state";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";
import { noopinterpolator } from "@/utils/animation/noop-interpolator";

const useRootAnimationBuilder = () => {
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const { currentScreenKey, previousScreenKey, nextScreenKey } =
		useScreenKeys();

	const previousScreen = ConfigStore.use((state) => {
		if (!previousScreenKey) return undefined;
		return state.screens[previousScreenKey];
	});

	const currentScreen = ConfigStore.use(
		(state) => state.screens[currentScreenKey],
	);

	const actualNextScreen = ConfigStore.use((state) => {
		if (!nextScreenKey) return undefined;
		return state.screens[nextScreenKey];
	});

	const activeTag = BoundStore.use((state) => state.activeTag);
	const allBounds = BoundStore.use((state) => state.bounds);

	const getAnimationValuesForScreen = useCallback(
		(screenId: string) => {
			const progress = ScreenProgressStore.getScreenProgress(screenId);
			const gesture = GestureStore.getAllForScreen(screenId);

			return {
				progress,
				gesture,
				bounds: {
					active: activeTag,
					all: allBounds[screenId] ?? {},
				},
			} satisfies ScreenProgress;
		},
		[activeTag, allBounds],
	);

	const interpolatorProps = useMemo(() => {
		const previous = previousScreen
			? getAnimationValuesForScreen(previousScreen.id)
			: undefined;
		const current = getAnimationValuesForScreen(currentScreenKey);
		const next = actualNextScreen
			? getAnimationValuesForScreen(actualNextScreen.id)
			: undefined;

		const base = {
			previous,
			current,
			next,
			layouts: { screen: dimensions },
			insets,
			closing: currentScreen?.closing || false,
			animating: ScreenProgressStore.getAnimatingStatus(currentScreenKey),
		} satisfies BaseScreenInterpolationProps;

		return additionalInterpolationProps(
			base,
		) satisfies ScreenInterpolationProps;
	}, [
		actualNextScreen,
		currentScreen,
		currentScreenKey,
		dimensions,
		getAnimationValuesForScreen,
		insets,
		previousScreen,
	]);

	const interpolator = useMemo(() => {
		const configsLoaded = !!actualNextScreen || !!currentScreen;
		let interpolatorStatus: ScreenInterpolatorState =
			ScreenInterpolatorState.UNDETERMINED;

		if (configsLoaded) {
			const hasInterpolator = !!(
				actualNextScreen?.screenStyleInterpolator ||
				currentScreen?.screenStyleInterpolator
			);
			interpolatorStatus = hasInterpolator
				? ScreenInterpolatorState.DEFINED
				: ScreenInterpolatorState.UNDEFINED;
		}

		return {
			screenInterpolatorState: interpolatorStatus,
			screenStyleInterpolator:
				actualNextScreen?.screenStyleInterpolator ||
				currentScreen?.screenStyleInterpolator ||
				noopinterpolator,
		} satisfies _BaseScreenInterpolationProps["interpolator"];
	}, [actualNextScreen, currentScreen]);

	return {
		interpolatorProps,
		interpolator,
	} satisfies _BaseScreenInterpolationProps;
};

const _useRootScreenAnimation = (): _BaseScreenInterpolationProps => {
	return useRootAnimationBuilder();
};

export { _useRootScreenAnimation };
