import React, {
	memo,
	type PropsWithChildren,
	useCallback,
	useMemo,
} from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	ScreenAnimationContext,
	useScreenAnimationContext,
} from "@/navigator/contexts/screen-animation-context";
import { useScreenKeys } from "@/navigator/contexts/screen-keys";
import { BoundStore } from "@/store/bound-store";
import { ConfigStore } from "@/store/config-store";
import { GestureStore } from "@/store/gesture-store";
import { ScreenProgressStore } from "@/store/screen-progress";
import type {
	_BaseScreenInterpolationProps,
	BaseScreenInterpolationProps,
	ScreenProgress,
} from "@/types/animation";
import { ScreenInterpolatorState } from "@/types/state";
import { noopinterpolator } from "@/utils/animation/noop-interpolator";

const useAnimationBuilder = (): _BaseScreenInterpolationProps => {
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
		[allBounds, activeTag],
	);

	return useMemo(() => {
		const current = getAnimationValuesForScreen(currentScreenKey);
		const next = actualNextScreen
			? getAnimationValuesForScreen(actualNextScreen.id)
			: undefined;

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
			previous: previousScreen
				? getAnimationValuesForScreen(previousScreen.id)
				: undefined,
			current,
			next,
			layouts: { screen: dimensions },
			insets,
			closing: currentScreen?.closing || false,
			animating: ScreenProgressStore.getAnimatingStatus(currentScreenKey),
			screenInterpolatorState: interpolatorStatus,
			screenStyleInterpolator:
				actualNextScreen?.screenStyleInterpolator ||
				currentScreen?.screenStyleInterpolator ||
				noopinterpolator,
		} satisfies _BaseScreenInterpolationProps;
	}, [
		currentScreenKey,
		currentScreen,
		actualNextScreen,
		dimensions,
		insets,
		getAnimationValuesForScreen,
		previousScreen,
	]);
};

const ScreenAnimationProvider: React.FC<PropsWithChildren> = memo(
	({ children }) => {
		const animationValues = useAnimationBuilder();

		return (
			<ScreenAnimationContext.Provider value={animationValues}>
				{children}
			</ScreenAnimationContext.Provider>
		);
	},
);

/**
 * Hook to get the full screen animation properties (internal)
 */
const _useScreenAnimation = (): _BaseScreenInterpolationProps => {
	return useScreenAnimationContext();
};

/**
 * Hook to get the public screen animation properties (public)
 */
const useScreenAnimation = (): BaseScreenInterpolationProps => {
	const { previous, current, next, layouts, insets, closing, animating } =
		useScreenAnimationContext();

	const animationProps: BaseScreenInterpolationProps = {
		previous,
		current,
		next,
		layouts,
		insets,
		closing,
		animating,
	};

	/**
	 * @note
	 * Using additionalInterpolationProps using .value on the js thread, giving us a reanimated warning. We should aim to improve this in the future, but to be fair, i dont think if you're defining animations at the screen level you would need the utils.
	 */
	return animationProps;
};

export { ScreenAnimationProvider, _useScreenAnimation, useScreenAnimation };
