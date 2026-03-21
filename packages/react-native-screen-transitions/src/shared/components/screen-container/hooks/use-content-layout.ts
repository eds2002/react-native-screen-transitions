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
	const experimental_animateOnInitialMount =
		current.options.experimental_animateOnInitialMount;
	const transitionSpec = current.options.transitionSpec;

	return useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			if (width <= 0 || height <= 0) return;

			const fraction = Math.min(height / screenHeight, 1);

			runOnUI((nextWidth: number, nextHeight: number, nextFraction: number) => {
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

				if (isFirstKey && !experimental_animateOnInitialMount) {
					animations.targetProgress.value = nextFraction;
					animations.progress.value = nextFraction;
					return;
				}

				animateToProgress({
					target: nextFraction,
					spec: transitionSpec,
					animations,
				});
			})(width, height, fraction);
		},
		[
			animations,
			autoSnapPointValue,
			contentLayoutValue,
			isFirstKey,
			screenHeight,
			experimental_animateOnInitialMount,
			transitionSpec,
		],
	);
}
