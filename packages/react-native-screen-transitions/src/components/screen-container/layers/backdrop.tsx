import { type ComponentType, memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { DefaultSnapSpec } from "../../../configs/specs";
import { useNavigationHelpers } from "../../../hooks/navigation/use-navigation-helpers";
import { useDescriptorsStore } from "../../../providers/screen/descriptors";
import { useSlotProps, useSlotStyles } from "../../../providers/screen/styles";
import { AnimationStore } from "../../../stores/animation.store";
import { GestureStore } from "../../../stores/gesture.store";
import { SystemStore } from "../../../stores/system.store";
import type {
	BackdropBehavior,
	ScreenBackdropComponentProps,
} from "../../../types/screen.types";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";
import { findCollapseTarget } from "../helpers/find-collapse-target";
import { usesLayerRenderProps } from "./render-component";

export const BackdropLayer = memo(function BackdropLayer({
	backdropBehavior,
	isBackdropActive,
}: {
	backdropBehavior: BackdropBehavior;
	isBackdropActive: boolean;
}) {
	const { isRemovePrevented, requestDismiss } = useNavigationHelpers();

	const routeKey = useDescriptorsStore(
		(store) => store.derivations.currentScreenKey,
	);
	const BackdropComponent = useDescriptorsStore(
		(store) => store.options.backdropComponent,
	);
	const rawSnapPoints = useDescriptorsStore(
		(store) => store.options.snapPoints,
	);
	const isGestureDismissEnabled = useDescriptorsStore(
		(store) => store.options.gestureEnabled !== false,
	);
	const canDismiss = isGestureDismissEnabled && !isRemovePrevented;
	const transitionSpec = useDescriptorsStore(
		(store) => store.options.transitionSpec,
	);
	const animations = AnimationStore.getBag(routeKey);
	const { targetProgress, animationProgress, resolvedAutoSnapPoint } =
		SystemStore.getBag(routeKey);

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
			requestDismiss();
			return;
		}

		if (backdropBehavior === "collapse") {
			// No snap points → fallback to dismiss
			if (!rawSnapPoints || rawSnapPoints.length === 0) {
				requestDismiss();
				return;
			}

			const gestures = GestureStore.getBag(routeKey);

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
					scheduleOnRN(requestDismiss);
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
		requestDismiss,
		routeKey,
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
