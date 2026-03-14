import { useCallback } from "react";
import { type LayoutChangeEvent, useWindowDimensions } from "react-native";
import { runOnUI } from "react-native-reanimated";
import {
	useDescriptorDerivations,
	useDescriptors,
} from "../../../providers/screen/descriptors";
import { AnimationStore } from "../../../stores/animation.store";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";

export function useContentLayout() {
	const { current } = useDescriptors();
	const { isFirstKey } = useDescriptorDerivations();
	const { height: screenHeight } = useWindowDimensions();
	const routeKey = current.route.key;
	const animations = AnimationStore.getRouteAnimations(routeKey);
	const autoSnapPointValue = AnimationStore.getAnimation(
		routeKey,
		"autoSnapPoint",
	);
	const contentLayoutValue = AnimationStore.getAnimation(
		routeKey,
		"contentLayout",
	);

	return useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			if (width <= 0 || height <= 0) return;

			const fraction = Math.min(height / screenHeight, 1);
			const transitionSpec = current.options.transitionSpec;

			runOnUI(
				(
					nextWidth: number,
					nextHeight: number,
					nextFraction: number,
					isInitialScreen: boolean,
					spec: typeof transitionSpec,
				) => {
					"worklet";
					contentLayoutValue.value = {
						width: nextWidth,
						height: nextHeight,
					};

					const isFirstMeasurement = autoSnapPointValue.value <= 0;
					autoSnapPointValue.value = nextFraction;

					if (
						!isFirstMeasurement ||
						animations.progress.value !== 0 ||
						animations.animating.value !== 0
					) {
						return;
					}

					if (isInitialScreen) {
						animations.targetProgress.value = nextFraction;
						animations.progress.value = nextFraction;
						return;
					}

					animateToProgress({
						target: nextFraction,
						spec,
						animations,
					});
				},
			)(width, height, fraction, isFirstKey, transitionSpec);
		},
		[
			animations,
			autoSnapPointValue,
			contentLayoutValue,
			current.options.transitionSpec,
			isFirstKey,
			screenHeight,
		],
	);
}
