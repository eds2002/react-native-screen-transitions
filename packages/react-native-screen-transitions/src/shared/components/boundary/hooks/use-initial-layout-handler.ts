import { useCallback, useRef } from "react";
import type { LayoutChangeEvent, ViewProps } from "react-native";
import { runOnUI, useSharedValue } from "react-native-reanimated";
import { AnimationStore } from "../../../stores/animation.store";
import type { MaybeMeasureAndStoreParams } from "../types";

export const useInitialLayoutHandler = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	maybeMeasureAndStore: (options: MaybeMeasureAndStoreParams) => void;
	onLayout?: ViewProps["onLayout"];
}) => {
	const {
		enabled,
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
		maybeMeasureAndStore,
		onLayout,
	} = params;

	const isAnimating = AnimationStore.getAnimation(
		currentScreenKey,
		"animating",
	);

	const ancestorAnimations = ancestorKeys.map((key) =>
		AnimationStore.getAnimation(key, "animating"),
	);

	const hasMeasuredOnLayout = useSharedValue(false);
	const hasScheduledInitialLayout = useRef(false);

	const handleInitialLayout = useCallback(() => {
		"worklet";
		if (!enabled) return;
		if (!sharedBoundTag || hasMeasuredOnLayout.get()) return;

		let isAnyAnimating = isAnimating.get();
		for (let i = 0; i < ancestorAnimations.length; i++) {
			if (ancestorAnimations[i].get()) {
				isAnyAnimating = 1;
				break;
			}
		}

		if (!isAnyAnimating) return;

		maybeMeasureAndStore({
			shouldSetSource: false,
			shouldSetDestination: true,
		});

		hasMeasuredOnLayout.set(true);
	}, [
		enabled,
		sharedBoundTag,
		hasMeasuredOnLayout,
		isAnimating,
		ancestorAnimations,
		maybeMeasureAndStore,
	]);

	return useCallback(
		(event: LayoutChangeEvent) => {
			onLayout?.(event);
			if (!enabled || hasScheduledInitialLayout.current) return;
			hasScheduledInitialLayout.current = true;
			runOnUI(handleInitialLayout)();
		},
		[enabled, onLayout, handleInitialLayout],
	);
};
