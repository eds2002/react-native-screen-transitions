import { StackActions } from "@react-navigation/native";
import { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { NO_STYLES } from "../constants";
import { useBackdropPointerEvents } from "../hooks/use-backdrop-pointer-events";
import { useKeys } from "../providers/screen/keys.provider";
import { useScreenStyles } from "../providers/screen/styles.provider";

type Props = {
	children: React.ReactNode;
};

export const ScreenContainer = memo(({ children }: Props) => {
	const { stylesMap } = useScreenStyles();
	const { current } = useKeys();
	const { pointerEvents, backdropBehavior } = useBackdropPointerEvents();

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
			<Animated.View
				style={[styles.content, animatedContentStyle]}
				pointerEvents={isDismissable ? "box-none" : pointerEvents}
			>
				{children}
			</Animated.View>
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
