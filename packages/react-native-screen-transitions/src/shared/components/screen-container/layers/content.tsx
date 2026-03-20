/** biome-ignore-all lint/style/noNonNullAssertion: <Screen gesture is under the gesture context, so this will always exist.> */
import { memo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useAnimatedProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import {
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_HOST_FLAG_STYLE_ID,
	NO_PROPS,
	NO_STYLES,
} from "../../../constants";
import { useGestureContext } from "../../../providers/gestures";
import { useDescriptors } from "../../../providers/screen/descriptors";
import { useScreenStyles } from "../../../providers/screen/styles.provider";
import { resolveNavigationMaskEnabled } from "../../../utils/resolve-screen-transition-options";
import { useBackdropPointerEvents } from "../hooks/use-backdrop-pointer-events";
import { useContentLayout } from "../hooks/use-content-layout";
import { MaybeMaskedNavigationContainer } from "./maybe-masked-navigation-container";
import { SurfaceContainer } from "./surface-container";

type Props = {
	children: React.ReactNode;
};

const IS_ANDROID = Platform.OS === "android";

export const ContentLayer = memo(({ children }: Props) => {
	const { stylesMap } = useScreenStyles();
	const { current } = useDescriptors();
	const { pointerEvents, isBackdropActive } = useBackdropPointerEvents();
	const gestureContext = useGestureContext();
	const isNavigationMaskEnabled = resolveNavigationMaskEnabled(current.options);
	const contentPointerEvents = isBackdropActive ? "box-none" : pointerEvents;
	const hasAutoSnapPoint =
		current.options.snapPoints?.includes("auto") ?? false;
	const handleContentLayout = useContentLayout();

	const animatedContentStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value.content?.style || NO_STYLES;
	});

	const animatedNavigationContainerStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value[NAVIGATION_CONTAINER_STYLE_ID]?.style || NO_STYLES;
	});

	const animatedNavigationHostGateStyle = useAnimatedStyle(() => {
		"worklet";
		return (
			stylesMap.value[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]?.style || NO_STYLES
		);
	});

	const animatedContentProps = useAnimatedProps(() => {
		"worklet";
		return stylesMap.value.content?.props ?? NO_PROPS;
	});

	const surfaceChildren = (
		<SurfaceContainer pointerEvents={contentPointerEvents}>
			{hasAutoSnapPoint ? (
				<View collapsable={false} onLayout={handleContentLayout}>
					{children}
				</View>
			) : (
				children
			)}
		</SurfaceContainer>
	);

	const navigationContainer = (
		<Animated.View
			style={[
				styles.navigationContainer,
				animatedNavigationContainerStyle,
				animatedNavigationHostGateStyle,
			]}
			pointerEvents={contentPointerEvents}
			collapsable={false}
			renderToHardwareTextureAndroid={IS_ANDROID && !isNavigationMaskEnabled}
			needsOffscreenAlphaCompositing={IS_ANDROID && !isNavigationMaskEnabled}
		>
			{surfaceChildren}
		</Animated.View>
	);

	const navigationScopedChildren = isNavigationMaskEnabled ? (
		<MaybeMaskedNavigationContainer
			pointerEvents={contentPointerEvents}
			enabled={isNavigationMaskEnabled}
		>
			{navigationContainer}
		</MaybeMaskedNavigationContainer>
	) : (
		navigationContainer
	);

	return (
		<GestureDetector gesture={gestureContext!.panGesture}>
			<Animated.View
				style={[styles.content, animatedContentStyle]}
				animatedProps={animatedContentProps}
				pointerEvents={contentPointerEvents}
			>
				{navigationScopedChildren}
			</Animated.View>
		</GestureDetector>
	);
});

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
	navigationContainer: {
		flex: 1,
	},
});
