import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import Transition from "react-native-screen-transitions";

const BOUNDARY_ID = "video-nested";

export default function MatchedScreenDebugPlayer() {
	const offset = useSharedValue(0);
	const animatedPlacementStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: offset.value }],
	}));

	const moveBoundary = () => {
		offset.value = withSpring(offset.value === 0 ? -96 : 0);
	};

	return (
		<View testID="matched-screen-debug-b" style={styles.screen}>
			<Animated.View style={animatedPlacementStyle}>
				<Transition.Boundary
					id={BOUNDARY_ID}
					testID="matched-screen-debug-b-boundary"
					style={styles.box}
				/>
			</Animated.View>
			<View style={styles.actions}>
				<Pressable
					testID="matched-screen-debug-b-move"
					style={styles.button}
					onPress={moveBoundary}
				>
					<Text style={styles.buttonText}>Move</Text>
				</Pressable>
				<Pressable
					testID="matched-screen-debug-b-next"
					style={styles.button}
					onPress={() => router.push("/matched-screen-debug/final")}
				>
					<Text style={styles.buttonText}>Next</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "green",
	},
	actions: {
		bottom: 80,
		flexDirection: "row",
		gap: 12,
		position: "absolute",
	},
	button: {
		backgroundColor: "white",
		borderRadius: 8,
		paddingHorizontal: 18,
		paddingVertical: 12,
	},
	buttonText: {
		color: "black",
		fontSize: 14,
		fontWeight: "700",
	},
	box: {
		width: 96,
		height: 96,
		maxWidth: 96,
		maxHeight: 96,
		aspectRatio: 1 / 1,
		borderWidth: 3,
		borderColor: "red",
		backgroundColor: "transparent",
	},
});
