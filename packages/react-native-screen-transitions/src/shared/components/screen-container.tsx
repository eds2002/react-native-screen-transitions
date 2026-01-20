/** biome-ignore-all lint/style/noNonNullAssertion: <Screen gesture is under the gesture context, so this will always exist.> */
import { StackActions } from "@react-navigation/native";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnUI, useAnimatedStyle } from "react-native-reanimated";
import { DefaultSnapSpec } from "../configs/specs";
import { NO_STYLES } from "../constants";
import { useBackdropPointerEvents } from "../hooks/use-backdrop-pointer-events";
import { useGestureContext } from "../providers/gestures.provider";
import { useKeys } from "../providers/screen/keys.provider";
import { useScreenStyles } from "../providers/screen/styles.provider";
import { AnimationStore } from "../stores/animation.store";
import { GestureStore } from "../stores/gesture.store";
import { animateToProgress } from "../utils/animation/animate-to-progress";
import { findCollapseTarget } from "../utils/gesture/find-collapse-target";

type Props = {
	children: React.ReactNode;
};

export const ScreenContainer = memo(({ children }: Props) => {
	const { stylesMap } = useScreenStyles();
	const { current } = useKeys();
	const { pointerEvents, backdropBehavior } = useBackdropPointerEvents();
	const gestureContext = useGestureContext();

	const isBackdropActive =
		backdropBehavior === "dismiss" || backdropBehavior === "collapse";

	const handleDismiss = useCallback(() => {
		const state = current.navigation.getState();
		current.navigation.dispatch({
			...StackActions.pop(),
			source: current.route.key,
			target: state.key,
		});
	}, [current]);

	const handleBackdropPress = useCallback(() => {
		if (backdropBehavior === "dismiss") {
			handleDismiss();
			return;
		}

		if (backdropBehavior === "collapse") {
			const snapPoints = current.options.snapPoints;
			const canDismiss = current.options.gestureEnabled !== false;

			// No snap points → fallback to dismiss
			if (!snapPoints || snapPoints.length === 0) {
				handleDismiss();
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
				if (gestures.isDismissing.value) return;

				gestures.isDismissing.value = shouldDismiss ? 1 : 0;

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
					onAnimationFinish: shouldDismiss ? handleDismiss : undefined,
				});
			})();
		}
	}, [backdropBehavior, current, handleDismiss]);

	const animatedContentStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value.contentStyle || NO_STYLES;
	});

	const animatedBackdropStyle = useAnimatedStyle(() => {
		"worklet";
		return (
			stylesMap.value.backdropStyle ?? stylesMap.value.overlayStyle ?? NO_STYLES
		);
	});

	return (
		<View style={styles.container} pointerEvents={pointerEvents}>
			<Pressable
				style={StyleSheet.absoluteFillObject}
				pointerEvents={isBackdropActive ? "auto" : "none"}
				onPress={isBackdropActive ? handleBackdropPress : undefined}
			>
				<Animated.View
					style={[StyleSheet.absoluteFillObject, animatedBackdropStyle]}
				/>
			</Pressable>
			<GestureDetector gesture={gestureContext!.panGesture}>
				<Animated.View
					style={[styles.content, animatedContentStyle]}
					pointerEvents={isBackdropActive ? "box-none" : pointerEvents}
				>
					{children}
				</Animated.View>
			</GestureDetector>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
});
