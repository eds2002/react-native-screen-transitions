/** biome-ignore-all lint/style/noNonNullAssertion: <Screen gesture is under the gesture context, so this will always exist.> */
import { memo, useCallback } from "react";
import {
	type LayoutChangeEvent,
	StyleSheet,
	useWindowDimensions,
	View,
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
	runOnUI,
	useAnimatedProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import { NO_PROPS, NO_STYLES } from "../../../constants";
import { useGestureContext } from "../../../providers/gestures";
import {
	useDescriptorDerivations,
	useDescriptors,
} from "../../../providers/screen/descriptors";
import { useScreenStyles } from "../../../providers/screen/styles.provider";
import { AnimationStore } from "../../../stores/animation.store";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";
import { useBackdropPointerEvents } from "../hooks/use-backdrop-pointer-events";
import { MaybeMaskedNavigationContainer } from "./maybe-masked-navigation-container";
import { SurfaceContainer } from "./surface-container";

type Props = {
	children: React.ReactNode;
};

export const ContentLayer = memo(({ children }: Props) => {
	const { stylesMap } = useScreenStyles();
	const { current } = useDescriptors();
	const { isFirstKey } = useDescriptorDerivations();
	const { pointerEvents, isBackdropActive } = useBackdropPointerEvents();
	const gestureContext = useGestureContext();
	const { height: screenHeight } = useWindowDimensions();
	const isNavigationMaskEnabled = !!current.options.maskEnabled;
	const contentPointerEvents = isBackdropActive ? "box-none" : pointerEvents;
	const routeKey = current.route.key;
	const animations = AnimationStore.getRouteAnimations(routeKey);
	const autoSnapPointValue = AnimationStore.getAnimation(
		routeKey,
		"autoSnapPoint",
	);
	const hasAutoSnapPoint =
		current.options.snapPoints?.includes("auto") ?? false;

	const animatedContentStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value.content?.style || NO_STYLES;
	});

	const animatedContentProps = useAnimatedProps(() => {
		"worklet";
		return stylesMap.value.content?.props ?? NO_PROPS;
	});

	const handleContentLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const contentHeight = event.nativeEvent.layout.height;
			if (contentHeight <= 0) return;

			const fraction = Math.min(contentHeight / screenHeight, 1);
			const transitionSpec = current.options.transitionSpec;

			runOnUI(
				(
					nextFraction: number,
					isInitialScreen: boolean,
					spec: typeof transitionSpec,
				) => {
					"worklet";
					const isFirstMeasurement = autoSnapPointValue.value <= 0;
					autoSnapPointValue.value = nextFraction;

					if (
						!isFirstMeasurement ||
						animations.progress.value !== 0 ||
						animations.animating.value !== 0
					) {
						return;
					}

					if (isInitialScreen) {
						animations.targetProgress.value = nextFraction;
						animations.progress.value = nextFraction;
						return;
					}

					animateToProgress({
						target: nextFraction,
						spec,
						animations,
					});
				},
			)(fraction, isFirstKey, transitionSpec);
		},
		[
			animations,
			autoSnapPointValue,
			current.options.transitionSpec,
			isFirstKey,
			screenHeight,
		],
	);

	return (
		<GestureDetector gesture={gestureContext!.panGesture}>
			<Animated.View
				style={[styles.content, animatedContentStyle]}
				animatedProps={animatedContentProps}
				pointerEvents={contentPointerEvents}
			>
				<MaybeMaskedNavigationContainer enabled={isNavigationMaskEnabled}>
					<SurfaceContainer pointerEvents={contentPointerEvents}>
						{hasAutoSnapPoint ? (
							<View collapsable={false} onLayout={handleContentLayout}>
								{children}
							</View>
						) : (
							children
						)}
					</SurfaceContainer>
				</MaybeMaskedNavigationContainer>
			</Animated.View>
		</GestureDetector>
	);
});

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
});
