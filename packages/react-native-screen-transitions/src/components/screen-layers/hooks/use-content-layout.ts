import { useCallback } from "react";
import { type LayoutChangeEvent, useWindowDimensions } from "react-native";
import { scheduleOnUI } from "react-native-worklets";
import { useOptionalBuilderStore } from "../../../providers/builder";
import { LifecycleTransitionRequestKind } from "../../../providers/motion/hooks/use-transition-values";
import { useOptionalMotionStore } from "../../../providers/motion/motion.store";

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
	const values = useOptionalMotionStore((store) =>
		builder ? store?.state : undefined,
	);
	const startsSettled = builder?.derivations.startsSettled;
	const snapPoint = isContent ? "auto" : styleId;
	const measureSnap =
		snapPoint !== undefined && builder?.options.snapPoints?.includes(snapPoint);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			if (!values) return;
			const {
				targetProgress,
				resolvedAutoSnapPoint,
				measuredContentLayout,
				autoOpenArmed,
			} = values;
			const { requestLifecycleTransition } = values.actions;
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
						!autoOpenArmed.get() ||
						values.transitionProgress.get() !== 0 ||
						values.progressAnimating.get() !== 0
					) {
						return;
					}

					if (startsSettled) {
						targetProgress.set(nextFraction);
						values.transitionProgress.set(nextFraction);
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
		[values, isContent, measureSnap, startsSettled, screenHeight],
	);
	return isContent || measureSnap ? handleLayout : undefined;
}
