import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	type StyleProps,
	useAnimatedStyle,
	useDerivedValue,
} from "react-native-reanimated";
import { _useScreenAnimation } from "../hooks/animation/use-screen-animation";

interface RootTransitionAwareProps {
	children: React.ReactNode;
}

const EMPTY_STYLE = Object.freeze({} as StyleProps);

const Overlay = memo(
	({ animatedOverlayStyle }: { animatedOverlayStyle: StyleProps }) => {
		return (
			<Animated.View
				style={[StyleSheet.absoluteFillObject, animatedOverlayStyle]}
				pointerEvents="none"
			/>
		);
	},
);

const Content = memo(
	({
		animatedContentStyle,
		children,
	}: {
		animatedContentStyle: StyleProps;
		children: React.ReactNode;
	}) => {
		return (
			<Animated.View style={[styles.content, animatedContentStyle]}>
				{children}
			</Animated.View>
		);
	},
);

const Container = memo(({ children }: { children: React.ReactNode }) => {
	return <View style={styles.container}>{children}</View>;
});

export const RootTransitionAware = memo(
	({ children }: RootTransitionAwareProps) => {
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

		return (
			<Container>
				<Overlay animatedOverlayStyle={animatedOverlayStyle} />
				<Content animatedContentStyle={animatedContentStyle}>
					{children}
				</Content>
			</Container>
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
