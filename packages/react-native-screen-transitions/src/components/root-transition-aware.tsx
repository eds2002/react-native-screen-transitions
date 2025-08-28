import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	type StyleProps,
	useAnimatedStyle,
	useDerivedValue,
} from "react-native-reanimated";
import { _useScreenAnimation } from "../hooks/animation/use-screen-animation";
import { useParentGestureRegistry } from "../hooks/gestures/use-parent-gesture-registry";

const EMPTY_STYLE = Object.freeze({} as StyleProps);

export const RootTransitionAware = memo(
	({ children }: { children: React.ReactNode }) => {
		const { screenInterpolatorProps, screenStyleInterpolator } =
			_useScreenAnimation();

		const animatedStyles = useDerivedValue(() => {
			"worklet";

			if (!screenStyleInterpolator) {
				return { content: EMPTY_STYLE, overlay: EMPTY_STYLE };
			}
			const interpolated = screenStyleInterpolator(
				screenInterpolatorProps.value,
			);

			return {
				content: interpolated.contentStyle || EMPTY_STYLE,
				overlay: interpolated.overlayStyle || EMPTY_STYLE,
			};
		});

		const animatedContentStyle = useAnimatedStyle(() => {
			"worklet";
			return animatedStyles.value.content;
		});

		const animatedOverlayStyle = useAnimatedStyle(() => {
			"worklet";
			return animatedStyles.value.overlay;
		});

		useParentGestureRegistry();
		return (
			<View style={styles.container}>
				<Animated.View
					style={[StyleSheet.absoluteFillObject, animatedOverlayStyle]}
					pointerEvents="none"
				/>
				<Animated.View style={[styles.content, animatedContentStyle]}>
					{children}
				</Animated.View>
			</View>
		);
	},
);

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
});
