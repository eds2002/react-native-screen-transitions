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
import { useBackdropPointerEvents } from "../../../hooks/use-backdrop-pointer-events";
import { useKeys } from "../../../providers/screen/keys.provider";
import { useScreenStyles } from "../../../providers/screen/styles.provider";
import { AnimationStore } from "../../../stores/animation.store";
import { GestureStore } from "../../../stores/gesture.store";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";
import { findCollapseTarget } from "../../../utils/gesture/find-collapse-target";

export const BackdropLayer = memo(function BackdropLayer() {
	const { stylesMap } = useScreenStyles();
	const { current } = useKeys();
	const { dismissScreen } = useNavigationHelpers();
	const { isBackdropActive, backdropBehavior } = useBackdropPointerEvents();

	const BackdropComponent = current.options.backdropComponent;

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
			const snapPoints = current.options.snapPoints;
			const canDismiss = current.options.gestureEnabled !== false;

			// No snap points → fallback to dismiss
			if (!snapPoints || snapPoints.length === 0) {
				dismissScreen();
				return;
			}

			const animations = AnimationStore.getAll(current.route.key);
			const gestures = GestureStore.getRouteGestures(current.route.key);
			const transitionSpec = current.options.transitionSpec;

			runOnUI(() => {
				"worklet";
				const { target, shouldDismiss } = findCollapseTarget(
					animations.progress.value,
					snapPoints,
					canDismiss,
				);

				// If already dismissing, skip
				if (gestures.dismissing.value) return;

				gestures.dismissing.value = shouldDismiss ? 1 : 0;

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
					onAnimationFinish: shouldDismiss ? dismissScreen : undefined,
				});
			})();
		}
	}, [backdropBehavior, current, dismissScreen]);

	const animatedBackdropStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value.backdrop?.style ?? NO_STYLES;
	});

	const animatedBackdropProps = useAnimatedProps(() => {
		"worklet";
		return stylesMap.value.backdrop?.props ?? NO_PROPS;
	});

	return (
		<Pressable
			style={StyleSheet.absoluteFillObject}
			pointerEvents={isBackdropActive ? "auto" : "none"}
			onPress={isBackdropActive ? handleBackdropPress : undefined}
		>
			{AnimatedBackdropComponent && (
				<AnimatedBackdropComponent
					style={[StyleSheet.absoluteFillObject]}
					animatedProps={animatedBackdropProps}
				/>
			)}
			<Animated.View
				style={[StyleSheet.absoluteFillObject, animatedBackdropStyle]}
			/>
		</Pressable>
	);
});
