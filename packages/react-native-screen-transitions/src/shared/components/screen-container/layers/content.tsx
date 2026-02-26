/** biome-ignore-all lint/style/noNonNullAssertion: <Screen gesture is under the gesture context, so this will always exist.> */
import { memo, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useAnimatedProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import {
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
	NO_PROPS,
	NO_STYLES,
} from "../../../constants";
import { useGestureContext } from "../../../providers/gestures";
import { useKeys } from "../../../providers/screen/keys";
import { useScreenStyles } from "../../../providers/screen/styles.provider";
import { logger } from "../../../utils/logger";
import { useBackdropPointerEvents } from "../hooks/use-backdrop-pointer-events";

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

export const ContentLayer = memo(({ children }: Props) => {
	const { stylesMap } = useScreenStyles();
	const { current } = useKeys();
	const { pointerEvents, isBackdropActive } = useBackdropPointerEvents();
	const gestureContext = useGestureContext();
	const isNavigationMaskEnabled = !!current.options.maskEnabled;

	const BackgroundComponent = current.options.backgroundComponent;

	const AnimatedBackgroundComponent = useMemo(
		() =>
			BackgroundComponent
				? Animated.createAnimatedComponent(BackgroundComponent)
				: null,
		[BackgroundComponent],
	);

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

	const contentChildren = isNavigationMaskEnabled ? (
		LazyMaskedView !== View ? (
			<LazyMaskedView
				style={styles.navigationMaskedRoot}
				// @ts-expect-error masked-view package types are too strict here
				maskElement={
					<Animated.View
						style={[styles.navigationMaskElement, animatedNavigationMaskStyle]}
					/>
				}
			>
				<Animated.View
					style={[styles.navigationContainer, animatedNavigationContainerStyle]}
				>
					{children}
				</Animated.View>
			</LazyMaskedView>
		) : (
			<Animated.View
				style={[styles.navigationContainer, animatedNavigationContainerStyle]}
			>
				{children}
			</Animated.View>
		)
	) : (
		children
	);

	return (
		<GestureDetector gesture={gestureContext!.panGesture}>
			{AnimatedBackgroundComponent ? (
				<AnimatedBackgroundComponent
					style={[
						styles.content,
						animatedContentStyle,
						animatedBackgroundStyle,
					]}
					animatedProps={animatedBackgroundProps}
					pointerEvents={isBackdropActive ? "box-none" : pointerEvents}
				>
					{contentChildren}
				</AnimatedBackgroundComponent>
			) : (
				<Animated.View
					style={[styles.content, animatedContentStyle]}
					animatedProps={animatedContentProps}
					pointerEvents={isBackdropActive ? "box-none" : pointerEvents}
				>
					{contentChildren}
				</Animated.View>
			)}
		</GestureDetector>
	);
});

const styles = StyleSheet.create({
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
