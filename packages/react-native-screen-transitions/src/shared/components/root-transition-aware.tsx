import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { NO_STYLES } from "../constants";
import { useScreenStyles } from "../providers/screen/styles.provider";

type Props = {
	children: React.ReactNode;
};

export const RootTransitionAware = memo(({ children }: Props) => {
	const { stylesMap } = useScreenStyles();

	const animatedContentStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value.contentStyle || NO_STYLES;
	});

	const animatedOverlayStyle = useAnimatedStyle(() => {
		"worklet";
		return stylesMap.value.overlayStyle || NO_STYLES;
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
