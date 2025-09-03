import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	type StyleProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import { useTransitionStyles } from "../providers/transition-styles";

type Props = {
	children: React.ReactNode;
};

const EMPTY_STYLE = Object.freeze({} as StyleProps);

export const RootTransitionAware = memo(({ children }: Props) => {
	const stylesMap = useTransitionStyles();

	const animatedContentStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value.contentStyle || EMPTY_STYLE;
	});

	const animatedOverlayStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value.overlayStyle || EMPTY_STYLE;
	});

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
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
});
