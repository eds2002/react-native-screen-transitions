/** biome-ignore-all lint/style/noNonNullAssertion: <Screen gesture is under the gesture context, so this will always exist.> */
import { StackActions } from "@react-navigation/native";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
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
	const { height: screenHeight } = useWindowDimensions();

	const BackdropComponent = current.options.backdropComponent;

	const isBackdropActive =
		backdropBehavior === "dismiss" || backdropBehavior === "collapse";

	const routeKey = current.route.key;
	const animations = AnimationStore.getAll(routeKey);
	const autoSnapPointValue = animations.autoSnapPoint;

	const hasAutoSnapPoint =
		current.options.snapPoints?.includes("auto") ?? false;

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
			const rawSnapPoints = current.options.snapPoints;
			const canDismiss = current.options.gestureEnabled !== false;

			// No snap points → fallback to dismiss
			if (!rawSnapPoints || rawSnapPoints.length === 0) {
				handleDismiss();
				return;
			}

			const gestures = GestureStore.getRouteGestures(routeKey);
			const transitionSpec = current.options.transitionSpec;

			runOnUI(() => {
				"worklet";
				// Resolve 'auto' snap points to numeric values inside the worklet
				const resolvedSnaps = rawSnapPoints
					.map((p) => (p === "auto" ? autoSnapPointValue.value : p))
					.filter((p): p is number => typeof p === "number" && p > 0);

				const { target, shouldDismiss } = findCollapseTarget(
					animations.progress.value,
					resolvedSnaps,
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
	}, [
		backdropBehavior,
		current,
		handleDismiss,
		routeKey,
		animations,
		autoSnapPointValue,
	]);

	// Measures the intrinsic content height when 'auto' is in snapPoints.
	// Sets autoSnapPoint on the UI thread so worklets can reactively read it.
	// If the open animation was deferred (progress still at 0), triggers it now.
	const handleContentLayout = useCallback(
		(event: { nativeEvent: { layout: { height: number } } }) => {
			const contentHeight = event.nativeEvent.layout.height;
			if (contentHeight <= 0) return;

			const fraction = Math.min(contentHeight / screenHeight, 1);
			const transitionSpec = current.options.transitionSpec;

			runOnUI(() => {
				"worklet";
				const isFirstMeasurement = autoSnapPointValue.value <= 0;
				autoSnapPointValue.value = fraction;

				// If the screen was waiting for measurement before opening, animate now
				if (
					isFirstMeasurement &&
					animations.progress.value === 0 &&
					animations.animating.value === 0
				) {
					animateToProgress({
						target: fraction,
						spec: transitionSpec,
						animations,
					});
				}
			})();
		},
		[
			screenHeight,
			current.options.transitionSpec,
			animations,
			autoSnapPointValue,
		],
	);

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
			{BackdropComponent ? (
				<BackdropComponent />
			) : (
				<Pressable
					style={StyleSheet.absoluteFillObject}
					pointerEvents={isBackdropActive ? "auto" : "none"}
					onPress={isBackdropActive ? handleBackdropPress : undefined}
				>
					<Animated.View
						style={[StyleSheet.absoluteFillObject, animatedBackdropStyle]}
					/>
				</Pressable>
			)}
			<GestureDetector gesture={gestureContext!.panGesture}>
				<Animated.View
					style={[styles.content, animatedContentStyle]}
					pointerEvents={isBackdropActive ? "box-none" : pointerEvents}
				>
					{hasAutoSnapPoint ? (
						<View onLayout={handleContentLayout}>{children}</View>
					) : (
						children
					)}
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
