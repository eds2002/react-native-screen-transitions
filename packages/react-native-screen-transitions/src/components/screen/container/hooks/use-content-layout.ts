import { useCallback } from "react";
import { type LayoutChangeEvent, useWindowDimensions } from "react-native";
import { scheduleOnUI } from "react-native-worklets";
import { useOptionalBuilderStore } from "../../../../providers/screen/builder";
import { useOptionalMotionStore } from "../../../../providers/screen/motion";
import { LifecycleTransitionRequestKind } from "../../../../providers/screen/motion/hooks/use-transition-values";

/** "content" identifies the full content wrapper and is reserved internally. */
export function useContentLayout(styleId: string | undefined) {
	const isContent = styleId === "content";
	const builder = useOptionalBuilderStore((store) =>
		isContent ||
		(styleId !== undefined && store?.options.snapPoints?.includes(styleId))
			? store
			: null,
	);
	const { height: screenHeight } = useWindowDimensions();
	const animations = useOptionalMotionStore((store) =>
		builder ? store?.state : undefined,
	);
	const isFirstKey = builder?.derivations.isFirstKey;
	const experimental_animateOnInitialMount =
		builder?.options.experimental_animateOnInitialMount;
	const snapPoint = isContent ? "auto" : styleId;
	const measureSnap =
		snapPoint !== undefined && builder?.options.snapPoints?.includes(snapPoint);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			if (!animations) return;
			const { targetProgress, resolvedAutoSnapPoint, measuredContentLayout } =
				animations;
			const { requestLifecycleTransition } = animations.actions;
			const { width, height } = event.nativeEvent.layout;
			if (width <= 0 || height <= 0) return;

			const fraction = Math.min(height / screenHeight, 1);

			scheduleOnUI(
				(nextWidth: number, nextHeight: number, nextFraction: number) => {
					"worklet";
					if (isContent) {
						measuredContentLayout.set({ width: nextWidth, height: nextHeight });
					}
					if (!measureSnap) return;

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
			isContent,
			measureSnap,
			isFirstKey,
			screenHeight,
			experimental_animateOnInitialMount,
		],
	);
	return isContent || measureSnap ? handleLayout : undefined;
}
