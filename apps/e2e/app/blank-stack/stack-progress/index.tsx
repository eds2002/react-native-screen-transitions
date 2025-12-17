import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
	interpolate,
	useAnimatedStyle,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useScreenAnimation } from "react-native-screen-transitions";

export default function StackProgressIndex() {
	const animation = useScreenAnimation();

	// First screen: animates based on stackProgress (reacts to all screens above)
	const containerStyle = useAnimatedStyle(() => {
		const { stackProgress } = animation.value;
		// As more screens are pushed, translate down and scale
		const translateY = interpolate(
			stackProgress,
			[1, 2, 3, 4],
			[0, 100, 180, 240],
		);
		const scale = interpolate(
			stackProgress,
			[1, 2, 3, 4],
			[1, 0.92, 0.85, 0.8],
		);
		const borderRadius = interpolate(
			stackProgress,
			[1, 2, 3, 4],
			[0, 16, 24, 32],
		);

		return {
			transform: [{ translateY }, { scale }],
			borderRadius,
		};
	});

	return (
		<Animated.View style={[styles.container, containerStyle]}>
			<SafeAreaView style={styles.inner}>
				<Text style={styles.title}>Stack Progress Demo</Text>
				<Text style={styles.description}>
					This screen animates via stackProgress as you push transparent screens
					on top. Watch it translate down and scale!
				</Text>

				<Pressable
					testID="push-stack"
					style={styles.button}
					onPress={() =>
						router.push({
							pathname: "/blank-stack/stack-progress/pushed",
							params: { depth: "2" },
						})
					}
				>
					<Text style={styles.buttonText}>Push Transparent Screen</Text>
				</Pressable>
			</SafeAreaView>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#6366f1",
		overflow: "hidden",
	},
	inner: {
		flex: 1,
		padding: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 16,
		textAlign: "center",
	},
	description: {
		fontSize: 16,
		color: "rgba(255,255,255,0.8)",
		textAlign: "center",
		marginBottom: 40,
		lineHeight: 24,
	},
	button: {
		backgroundColor: "rgba(255,255,255,0.2)",
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
});
