/** biome-ignore-all lint/style/noNonNullAssertion: <Screen gesture is under the gesture context, so this will always exist.> */
import { StackActions } from "@react-navigation/native";
import { memo, useCallback, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
	runOnUI,
	useAnimatedProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import { DefaultSnapSpec } from "../configs/specs";
import {
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
	NO_STYLES,
} from "../constants";
import { useBackdropPointerEvents } from "../hooks/use-backdrop-pointer-events";
import { useGestureContext } from "../providers/gestures.provider";
import { useKeys } from "../providers/screen/keys.provider";
import { useScreenStyles } from "../providers/screen/styles.provider";
import { AnimationStore } from "../stores/animation.store";
import { GestureStore } from "../stores/gesture.store";
import { animateToProgress } from "../utils/animation/animate-to-progress";
import { findCollapseTarget } from "../utils/gesture/find-collapse-target";
import { logger } from "../utils/logger";

type Props = {
	children: React.ReactNode;
};

let LazyMaskedView = View;

try {
	LazyMaskedView = require("@react-native-masked-view/masked-view").default;
} catch (_) {
	// optional peer dependency
}

let hasWarnedMissingMaskedView = false;

const NO_PROPS = Object.freeze({});

export const ScreenContainer = memo(({ children }: Props) => {
	const { stylesMap } = useScreenStyles();
	const { current } = useKeys();
	const { pointerEvents, backdropBehavior } = useBackdropPointerEvents();
	const gestureContext = useGestureContext();
	const isNavigationMaskEnabled = !!current.options.maskEnabled;

	const BackdropComponent = current.options.backdropComponent;
	const BackgroundComponent = current.options.backgroundComponent;

	// Memoize animated component wrappers so createAnimatedComponent is only called
	// when the underlying component reference changes.
	const AnimatedBackdropComponent = useMemo(
		() =>
			BackdropComponent
				? Animated.createAnimatedComponent(BackdropComponent)
				: null,
		[BackdropComponent],
	);

	const AnimatedBackgroundComponent = useMemo(
		() =>
			BackgroundComponent
				? Animated.createAnimatedComponent(BackgroundComponent)
				: null,
		[BackgroundComponent],
	);

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

	// ── Content ──
	const animatedContentStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value.content?.style || NO_STYLES;
	});

	const animatedContentProps = useAnimatedProps(() => {
		"worklet";
		return stylesMap.value.content?.props ?? NO_PROPS;
	});

	// ── Navigation mask / container ──
	const animatedNavigationContainerStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value[NAVIGATION_CONTAINER_STYLE_ID]?.style || NO_STYLES;
	});

	const animatedNavigationMaskStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value[NAVIGATION_MASK_STYLE_ID]?.style || NO_STYLES;
	});

	// ── Backdrop ──
	const animatedBackdropStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value.backdrop?.style ?? NO_STYLES;
	});

	const animatedBackdropProps = useAnimatedProps(() => {
		"worklet";
		return stylesMap.value.backdrop?.props ?? NO_PROPS;
	});

	// ── Background ──
	const animatedBackgroundStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value.background?.style ?? NO_STYLES;
	});

	const animatedBackgroundProps = useAnimatedProps(() => {
		"worklet";
		return stylesMap.value.background?.props ?? NO_PROPS;
	});

	useEffect(() => {
		if (!isNavigationMaskEnabled) return;
		if (LazyMaskedView !== View) return;
		if (hasWarnedMissingMaskedView) return;

		hasWarnedMissingMaskedView = true;
		logger.warn(
			"maskEnabled requires @react-native-masked-view/masked-view. Install it to enable navigation bounds masking.",
		);
	}, [isNavigationMaskEnabled]);

	return (
		<View style={styles.container} pointerEvents={pointerEvents}>
			{/* ── Backdrop layer (between screens) ── */}
			<Pressable
				style={StyleSheet.absoluteFillObject}
				pointerEvents={isBackdropActive ? "auto" : "none"}
				onPress={isBackdropActive ? handleBackdropPress : undefined}
			>
				{AnimatedBackdropComponent ? (
					<AnimatedBackdropComponent
						style={[StyleSheet.absoluteFillObject, animatedBackdropStyle]}
						animatedProps={animatedBackdropProps}
					/>
				) : (
					<Animated.View
						style={[StyleSheet.absoluteFillObject, animatedBackdropStyle]}
					/>
				)}
			</Pressable>

			{/* ── Content layer ── */}
			<GestureDetector gesture={gestureContext!.panGesture}>
				<Animated.View
					style={[styles.content, animatedContentStyle]}
					animatedProps={animatedContentProps}
					pointerEvents={isBackdropActive ? "box-none" : pointerEvents}
				>
					{/* ── Background layer (inside content scope, behind children) ── */}
					{AnimatedBackgroundComponent && (
						<AnimatedBackgroundComponent
							style={[StyleSheet.absoluteFillObject, animatedBackgroundStyle]}
							animatedProps={animatedBackgroundProps}
						/>
					)}

					{isNavigationMaskEnabled ? (
						LazyMaskedView !== View ? (
							<LazyMaskedView
								style={styles.navigationMaskedRoot}
								// @ts-expect-error masked-view package types are too strict here
								maskElement={
									<Animated.View
										style={[
											styles.navigationMaskElement,
											animatedNavigationMaskStyle,
										]}
									/>
								}
							>
								<Animated.View
									style={[
										styles.navigationContainer,
										animatedNavigationContainerStyle,
									]}
								>
									{children}
								</Animated.View>
							</LazyMaskedView>
						) : (
							<Animated.View
								style={[
									styles.navigationContainer,
									animatedNavigationContainerStyle,
								]}
							>
								{children}
							</Animated.View>
						)
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
	navigationMaskedRoot: {
		flex: 1,
	},
	navigationMaskElement: {
		backgroundColor: "white",
	},
	navigationContainer: {
		flex: 1,
	},
});
