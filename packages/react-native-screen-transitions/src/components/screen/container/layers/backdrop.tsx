import { type ComponentType, memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { DefaultSnapSpec } from "../../../../configs/specs";
import { useBuilderStore } from "../../../../providers/screen/builder";
import { useMotionStore } from "../../../../providers/screen/motion";
import {
	useSlotProps,
	useSlotStyles,
} from "../../../../providers/screen/orchestrator/styles";
import type {
	BackdropBehavior,
	ScreenBackdropComponentProps,
} from "../../../../types/screen.types";
import { animateToProgress } from "../../../../utils/animation/animate-to-progress";
import { findCollapseTarget } from "../helpers/find-collapse-target";
import { usesLayerRenderProps } from "./render-component";

export const BackdropLayer = memo(function BackdropLayer({
	backdropBehavior,
	isBackdropActive,
	onDismissRequest,
}: {
	backdropBehavior: BackdropBehavior;
	isBackdropActive: boolean;
	onDismissRequest?: () => void;
}) {
	const BackdropComponent = useBuilderStore(
		(store) => store.options.backdropComponent,
	);
	const rawSnapPoints = useBuilderStore((store) => store.options.snapPoints);
	const isGestureDismissEnabled = useBuilderStore(
		(store) => store.options.gestureEnabled !== false,
	);
	const canDismiss = isGestureDismissEnabled;
	const transitionSpec = useBuilderStore(
		(store) => store.options.transitionSpec,
	);
	const animations = useMotionStore((store) => store.state);
	const { targetProgress, animationProgress, resolvedAutoSnapPoint } =
		animations;

	const AnimatedBackdropComponent = useMemo(
		() =>
			BackdropComponent && !usesLayerRenderProps(BackdropComponent)
				? Animated.createAnimatedComponent(
						BackdropComponent as ComponentType<any>,
					)
				: null,
		[BackdropComponent],
	);

	const handleBackdropPress = useCallback(() => {
		if (backdropBehavior === "dismiss") {
			onDismissRequest?.();
			return;
		}

		if (backdropBehavior === "collapse") {
			// No snap points → fallback to dismiss
			if (!rawSnapPoints || rawSnapPoints.length === 0) {
				onDismissRequest?.();
				return;
			}

			const gestures = animations;

			scheduleOnUI(() => {
				"worklet";
				const resolvedSnaps: number[] = [];

				for (let i = 0; i < rawSnapPoints.length; i++) {
					const point = rawSnapPoints[i];
					const resolvedPoint =
						point === "auto" ? resolvedAutoSnapPoint.get() : point;

					if (typeof resolvedPoint === "number") {
						resolvedSnaps.push(resolvedPoint);
					}
				}

				const { target, shouldDismiss } = findCollapseTarget(
					animations.transitionProgress.get(),
					resolvedSnaps,
					canDismiss,
				);

				// If already dismissing, skip
				if (gestures.dismissing.get()) return;

				gestures.dismissing.set(shouldDismiss ? 1 : 0);

				const spec = shouldDismiss
					? transitionSpec
					: {
							open: transitionSpec?.expand ?? DefaultSnapSpec,
							close: transitionSpec?.collapse ?? DefaultSnapSpec,
						};

				animateToProgress({
					target,
					markEntering: false,
					spec,
					animations,
					targetProgress,
					animationProgress,
				});

				if (shouldDismiss) {
					if (onDismissRequest) scheduleOnRN(onDismissRequest);
				}
			});
		}
	}, [
		animations,
		targetProgress,
		animationProgress,
		resolvedAutoSnapPoint,
		backdropBehavior,
		rawSnapPoints,
		canDismiss,
		transitionSpec,
		onDismissRequest,
	]);

	const animatedBackdropStyle = useSlotStyles("backdrop");
	const animatedBackdropProps = useSlotProps("backdrop");
	const backdropPointerEvents = isBackdropActive ? "auto" : "none";
	const backdropStyles = [
		StyleSheet.absoluteFill,
		animatedBackdropStyle,
	] as ScreenBackdropComponentProps["styles"];
	const backdropProps =
		animatedBackdropProps as ScreenBackdropComponentProps["props"];

	return (
		<Pressable
			style={StyleSheet.absoluteFill}
			pointerEvents={isBackdropActive ? "auto" : "none"}
			onPress={isBackdropActive ? handleBackdropPress : undefined}
		>
			{AnimatedBackdropComponent ? (
				<AnimatedBackdropComponent
					style={backdropStyles}
					animatedProps={animatedBackdropProps}
					pointerEvents={backdropPointerEvents}
				/>
			) : BackdropComponent ? (
				<BackdropComponent
					styles={backdropStyles}
					props={backdropProps}
					pointerEvents={backdropPointerEvents}
				/>
			) : (
				<Animated.View
					style={backdropStyles}
					pointerEvents={backdropPointerEvents}
				/>
			)}
		</Pressable>
	);
});
