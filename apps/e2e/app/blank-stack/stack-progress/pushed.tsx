import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	interpolate,
	useAnimatedStyle,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useScreenAnimation } from "react-native-screen-transitions";

export default function StackProgressPushed() {
	const params = useLocalSearchParams<{ depth?: string }>();
	const depth = Number(params.depth ?? "2");
	const animation = useScreenAnimation();

	// Animate X button on entry
	const xButtonStyle = useAnimatedStyle(() => {
		const { progress } = animation.value;
		const opacity = interpolate(progress, [0, 1], [0, 1]);
		const scale = interpolate(progress, [0, 1], [0.5, 1]);
		return {
			opacity,
			transform: [{ scale }],
		};
	});

	return (
		<View style={styles.container}>
			<SafeAreaView style={styles.inner}>
				<Animated.View style={[styles.xButton, xButtonStyle]}>
					<Pressable testID="go-back" onPress={() => router.back()}>
						<Text style={styles.xButtonText}>X</Text>
					</Pressable>
				</Animated.View>

				<View style={styles.depthBadge}>
					<Text style={styles.depthText}>Screen {depth}</Text>
				</View>

				<Pressable
					testID="push-another"
					style={styles.pushButton}
					onPress={() =>
						router.push({
							pathname: "/blank-stack/stack-progress/pushed",
							params: { depth: String(depth + 1) },
						})
					}
				>
					<Text style={styles.pushButtonText}>Push Another</Text>
				</Pressable>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	inner: {
		flex: 1,
		padding: 24,
	},
	xButton: {
		position: "absolute",
		top: 60,
		right: 24,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	xButtonText: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#fff",
	},
	depthBadge: {
		position: "absolute",
		top: 60,
		left: 24,
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	depthText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#fff",
	},
	pushButton: {
		position: "absolute",
		bottom: 100,
		alignSelf: "center",
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	pushButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
});
