import { useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BoundStore } from "@/store/bound-store";
import { ConfigStore } from "@/store/config-store";
import { GestureStore } from "@/store/gesture-store";
import { ScreenProgressStore } from "@/store/screen-progress";
import type {
	_BaseScreenInterpolationProps,
	ScreenProgress,
} from "@/types/animation";
import { noopinterpolator } from "@/utils/animation/noop-interpolator";

interface UseRootScreenAnimationProps {
	currentScreenKey: string;
	previousScreenKey?: string;
	nextScreenKey?: string;
}

const useRootAnimationBuilder = ({
	currentScreenKey,
	previousScreenKey,
	nextScreenKey,
}: UseRootScreenAnimationProps) => {
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();

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
				activeBoundId: activeTag ?? undefined,
				allBounds: allBounds[screenId] ?? undefined,
			} satisfies ScreenProgress;
		},
		[allBounds, activeTag],
	);

	return useMemo(() => {
		const current = getAnimationValuesForScreen(currentScreenKey);
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
			animating: ScreenProgressStore.getAnimatingStatus(currentScreenKey),
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

const _useRootScreenAnimation = (
	props: UseRootScreenAnimationProps,
): _BaseScreenInterpolationProps => {
	return useRootAnimationBuilder(props);
};

export { _useRootScreenAnimation };
