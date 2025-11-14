import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
	type DerivedValue,
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSharedValueState } from "../../shared/hooks/use-shared-value-state";
import { useKeys } from "../../shared/providers/keys";
import {
	AnimationStore,
	type AnimationStoreMap,
} from "../../shared/stores/animation-store";
import { GestureStore } from "../../shared/stores/gesture-store";
import type { OverlayInterpolationProps } from "../../shared/types/animation";
import { useStackNavigationContext } from "../utils/with-stack-navigation";

/**
 * Aggregates progress values for the overlay owner and every scene that sits
 * above it in the stack. The result can be consumed by floating overlays to
 * drive animations that span multiple screens.
 */
export const useOverlayAnimation = (): {
	animation: DerivedValue<OverlayInterpolationProps>;
	optimisticActiveIndex: number;
} => {
	const { current } = useKeys();
	const { scenes, focusedIndex } = useStackNavigationContext();
	const routeKey = current?.route?.key;

	const gestureState = routeKey
		? GestureStore.getRouteGestures(routeKey)
		: null;

	const fallbackIsDismissing = useSharedValue(0);

	const progressValues = useMemo(() => {
		if (!routeKey) {
			return [];
		}

		const overlayIndex = scenes.findIndex(
			(scene) => scene.route.key === routeKey,
		);

		if (overlayIndex === -1) {
			return [];
		}

		return scenes.slice(overlayIndex).map((scene) => {
			return AnimationStore.getAll(scene.route.key);
		});
	}, [routeKey, scenes]);

	const accumulatedProgress = useDerivedValue(() => {
		"worklet";

		let total = 0;

		for (let i = 0; i < progressValues.length; i += 1) {
			total += progressValues[i].progress.value;
		}

		return total;
	}, [progressValues]);

	const optimisticActiveIndexValue = useDerivedValue(() => {
		"worklet";

		const activeIndex = progressValues.length - 1;

		const isOneDismissing = Number(
			progressValues.some((value) => value.closing.value > 0),
		);

		const optimisticIndex = activeIndex - isOneDismissing;

		return optimisticIndex;
	});

	const optimisticActiveIndex = useSharedValueState(optimisticActiveIndexValue);

	const screen = useWindowDimensions();

	const insets = useSafeAreaInsets();

	const animation = useDerivedValue<OverlayInterpolationProps>(() => ({
		progress: accumulatedProgress.value,
		layouts: {
			screen,
		},
		insets,
	}));

	return {
		animation,
		optimisticActiveIndex,
	};
};
