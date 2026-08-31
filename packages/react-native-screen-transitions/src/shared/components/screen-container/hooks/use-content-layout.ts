import { useCallback } from "react";
import { type LayoutChangeEvent, useWindowDimensions } from "react-native";
import { runOnUI } from "react-native-reanimated";
import {
	globalSmoothClipCoordinatorRuntime,
	INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION,
} from "../../../providers/screen/clips/coordinator/runtime-store";
import {
	useDescriptorDerivations,
	useDescriptors,
} from "../../../providers/screen/descriptors";
import { AnimationStore } from "../../../stores/animation.store";
import {
	LifecycleTransitionRequestKind,
	SystemStore,
} from "../../../stores/system.store";

export function useContentLayout() {
	const { current } = useDescriptors();
	const { isFirstKey } = useDescriptorDerivations();
	const { height: screenHeight } = useWindowDimensions();
	const routeKey = current.route.key;
	const animations = AnimationStore.getBag(routeKey);
	const system = SystemStore.getBag(routeKey);

	const { targetProgress, resolvedAutoSnapPoint, measuredContentLayout } =
		system;
	const { requestLifecycleTransition } = system.actions;

	const experimental_animateOnInitialMount =
		current.options.experimental_animateOnInitialMount;

	return useCallback(
		(event: LayoutChangeEvent) => {
			const { width, height } = event.nativeEvent.layout;
			if (width <= 0 || height <= 0) return;
			if (INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION) {
				globalSmoothClipCoordinatorRuntime.notifyRelayout(routeKey);
			}

			const fraction = Math.min(height / screenHeight, 1);

			runOnUI((nextWidth: number, nextHeight: number, nextFraction: number) => {
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
			})(width, height, fraction);
		},
		[
			animations,
			targetProgress,
			resolvedAutoSnapPoint,
			measuredContentLayout,
			isFirstKey,
			screenHeight,
			experimental_animateOnInitialMount,
			routeKey,
			requestLifecycleTransition,
		],
	);
}
