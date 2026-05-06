import { memo, useCallback, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
	runOnUI,
	useAnimatedProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import { DefaultSnapSpec } from "../../../configs/specs";
import { NO_PROPS, NO_STYLES } from "../../../constants";
import { useNavigationHelpers } from "../../../hooks/navigation/use-navigation-helpers";
import { useDescriptors } from "../../../providers/screen/descriptors";
import { useScreenStyles } from "../../../providers/screen/styles";
import { AnimationStore } from "../../../stores/animation.store";
import { GestureStore } from "../../../stores/gesture.store";
import { SystemStore } from "../../../stores/system.store";
import type { BackdropBehavior } from "../../../types/screen.types";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";
import { findCollapseTarget } from "../helpers/find-collapse-target";

export const BackdropLayer = memo(function BackdropLayer({
	backdropBehavior,
	isBackdropActive,
}: {
	backdropBehavior: BackdropBehavior;
	isBackdropActive: boolean;
}) {
	const { stylesMap } = useScreenStyles();
	const { current } = useDescriptors();
	const { dismissScreen } = useNavigationHelpers();

	const BackdropComponent = current.options.backdropComponent;
	const routeKey = current.route.key;
	const animations = AnimationStore.getBag(routeKey);
	const { targetProgress, resolvedAutoSnapPoint } =
		SystemStore.getBag(routeKey);

	const AnimatedBackdropComponent = useMemo(
		() =>
			BackdropComponent
				? Animated.createAnimatedComponent(BackdropComponent)
				: null,
		[BackdropComponent],
	);

	const handleBackdropPress = useCallback(() => {
		if (backdropBehavior === "dismiss") {
			dismissScreen();
			return;
		}

		if (backdropBehavior === "collapse") {
			const rawSnapPoints = current.options.snapPoints;
			const canDismiss = current.options.gestureEnabled !== false;

			// No snap points → fallback to dismiss
			if (!rawSnapPoints || rawSnapPoints.length === 0) {
				dismissScreen();
				return;
			}

			const gestures = GestureStore.getBag(routeKey);
			const transitionSpec = current.options.transitionSpec;

			runOnUI(() => {
				"worklet";
				const resolvedSnaps = rawSnapPoints
					.map((point) =>
						point === "auto" ? resolvedAutoSnapPoint.get() : point,
					)
					.filter((point): point is number => typeof point === "number");

				const { target, shouldDismiss } = findCollapseTarget(
					animations.progress.get(),
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
					spec,
					animations,
					targetProgress,
					onAnimationFinish: shouldDismiss ? dismissScreen : undefined,
				});
			})();
		}
	}, [
		animations,
		targetProgress,
		resolvedAutoSnapPoint,
		backdropBehavior,
		current,
		dismissScreen,
		routeKey,
	]);

	const animatedBackdropStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.get().backdrop?.style ?? NO_STYLES;
	});

	const animatedBackdropProps = useAnimatedProps(() => {
		"worklet";
		return stylesMap.get().backdrop?.props ?? NO_PROPS;
	});

	return (
		<Pressable
			style={StyleSheet.absoluteFill}
			pointerEvents={isBackdropActive ? "auto" : "none"}
			onPress={isBackdropActive ? handleBackdropPress : undefined}
		>
			{/* Keep blur props and visual style separated.
			 * BlurView's animatable ref points at the inner native blur view, and mixing
			 * animated style with animatedProps can break intensity updates. */}
			{AnimatedBackdropComponent && (
				<AnimatedBackdropComponent
					style={[StyleSheet.absoluteFill]}
					animatedProps={animatedBackdropProps}
				/>
			)}
			<Animated.View style={[StyleSheet.absoluteFill, animatedBackdropStyle]} />
		</Pressable>
	);
});
