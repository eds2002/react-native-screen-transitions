import type React from "react";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Easing,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/theme";

type ButtonProps = {
	children?: React.ReactNode;
	onPress?: () => void;
	style?: ViewStyle;
	disabled?: boolean;

	variant?: "solid" | "ghost";
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Button = ({
	children,
	onPress,
	style,
	disabled,
	variant = "solid",
}: ButtonProps) => {
	const scale = useSharedValue(1);
	const theme = useTheme();

	const tap = useMemo(
		() =>
			Gesture.Tap()
				.enabled(!disabled)
				.onBegin(() => {
					scale.value = withTiming(0.96, {
						duration: 400,
						easing: Easing.bezierFn(0.175, 0.885, 0.32, 1.1),
					});
				})
				.onTouchesCancelled(() => {
					scale.value = withTiming(1, {
						duration: 400,
						easing: Easing.bezierFn(0.175, 0.885, 0.32, 1.1),
					});
				})
				.onEnd(() => {
					scale.value = withTiming(1, {
						duration: 400,
						easing: Easing.bezierFn(0.175, 0.885, 0.32, 1.1),
					});
				})
				.onFinalize((_ev, success) => {
					if (success && onPress) {
						runOnJS(onPress)();
					}
				}),
		[disabled, onPress, scale],
	);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: disabled ? 0.5 : 1,
	}));

	return (
		<GestureDetector gesture={tap}>
			<AnimatedPressable
				accessible
				disabled={disabled}
				style={[
					styles.base,
					variant === "solid" && { backgroundColor: theme.actionButton },
					variant === "ghost" && { backgroundColor: theme.secondaryButton },
					style,
					animatedStyle,
				]}
			>
				<Text
					style={[
						styles.textBase,
						variant === "solid" && { color: theme.actionButtonText },
						variant === "ghost" && { color: theme.secondaryButtonText },
					]}
				>
					{children}
				</Text>
			</AnimatedPressable>
		</GestureDetector>
	);
};

export default memo(Button);

const styles = StyleSheet.create({
	base: {
		borderRadius: 999,
		paddingHorizontal: 20,
		paddingVertical: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	textBase: {
		fontWeight: "600",
	},
});
