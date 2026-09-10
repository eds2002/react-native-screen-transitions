import { useCallback } from "react";
import { type LayoutChangeEvent, useWindowDimensions } from "react-native";
import { scheduleOnUI } from "react-native-worklets";
import { useBuilderStore } from "../../../../providers/screen/builder";
import { useMotionStore } from "../../../../providers/screen/motion";
import { LifecycleTransitionRequestKind } from "../../../../providers/screen/motion/hooks/use-transition-values";

export function useContentLayout() {
	const isFirstKey = useBuilderStore((store) => store.derivations.isFirstKey);
	const experimental_animateOnInitialMount = useBuilderStore(
		(store) => store.options.experimental_animateOnInitialMount,
	);
	const { height: screenHeight } = useWindowDimensions();
	const animations = useMotionStore((store) => store.state);

	const { targetProgress, resolvedAutoSnapPoint, measuredContentLayout } =
		animations;
	const { requestLifecycleTransition } = animations.actions;

	return useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			if (width <= 0 || height <= 0) return;

			const fraction = Math.min(height / screenHeight, 1);

			scheduleOnUI(
				(nextWidth: number, nextHeight: number, nextFraction: number) => {
					"worklet";
					measuredContentLayout.set({
						width: nextWidth,
						height: nextHeight,
					});

					const isFirstMeasurement = resolvedAutoSnapPoint.get() <= 0;
					resolvedAutoSnapPoint.set(nextFraction);

					if (
						!isFirstMeasurement ||
						animations.transitionProgress.get() !== 0 ||
						animations.progressAnimating.get() !== 0
					) {
						return;
					}

					if (isFirstKey && !experimental_animateOnInitialMount) {
						targetProgress.set(nextFraction);
						animations.transitionProgress.set(nextFraction);
						return;
					}

					requestLifecycleTransition(
						LifecycleTransitionRequestKind.Open,
						nextFraction,
					);
				},
				width,
				height,
				fraction,
			);
		},
		[
			animations,
			targetProgress,
			resolvedAutoSnapPoint,
			measuredContentLayout,
			isFirstKey,
			screenHeight,
			experimental_animateOnInitialMount,
			requestLifecycleTransition,
		],
	);
}
