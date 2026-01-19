/** biome-ignore-all lint/style/noNonNullAssertion: <Screen gesture is under the gesture context, so this will always exist.> */
import { StackActions } from "@react-navigation/native";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { NO_STYLES } from "../constants";
import { useBackdropPointerEvents } from "../hooks/use-backdrop-pointer-events";
import { useGestureContext } from "../providers/gestures.provider";
import { useKeys } from "../providers/screen/keys.provider";
import { useScreenStyles } from "../providers/screen/styles.provider";

type Props = {
	children: React.ReactNode;
};

export const ScreenContainer = memo(({ children }: Props) => {
	const { stylesMap } = useScreenStyles();
	const { current } = useKeys();
	const { pointerEvents, backdropBehavior } = useBackdropPointerEvents();
	const gestureContext = useGestureContext();

	const isDismissable = backdropBehavior === "dismiss";

	const handleBackdropPress = useCallback(() => {
		current.navigation.dispatch(StackActions.pop());
	}, [current.navigation]);

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
				pointerEvents={isDismissable ? "auto" : "none"}
				onPress={isDismissable ? handleBackdropPress : undefined}
			>
				<Animated.View
					style={[StyleSheet.absoluteFillObject, animatedBackdropStyle]}
				/>
			</Pressable>
			<GestureDetector gesture={gestureContext!.panGesture}>
				<Animated.View
					style={[styles.content, animatedContentStyle]}
					pointerEvents={isDismissable ? "box-none" : pointerEvents}
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
