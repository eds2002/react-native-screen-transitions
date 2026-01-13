import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	interpolate,
	interpolateColor,
	useAnimatedStyle,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { snapTo, useScreenAnimation } from "react-native-screen-transitions";

import { ScreenHeader } from "@/components/screen-header";

const SNAP_POINTS = [
	{ index: 0, label: "25%", color: "#ef4444" },
	{ index: 1, label: "50%", color: "#f59e0b" },
	{ index: 2, label: "75%", color: "#22c55e" },
	{ index: 3, label: "100%", color: "#3b82f6" },
];

export default function SnapIndexAnimationScreen() {
	const animationProps = useScreenAnimation();

	// Animate background color based on snapIndex
	const containerStyle = useAnimatedStyle(() => {
		const { snapIndex } = animationProps.value;
		// Interpolate color based on snap index
		const backgroundColor = interpolateColor(
			snapIndex,
			[0, 1, 2, 3],
			["#2d1f1f", "#2d2a1f", "#1f2d1f", "#1f1f2d"],
		);
		return { backgroundColor };
	});

	// Animate indicator based on snapIndex
	const indicatorStyle = useAnimatedStyle(() => {
		const { snapIndex } = animationProps.value;
		// Scale up as we approach higher snap points
		const scale = interpolate(snapIndex, [0, 3], [0.8, 1.2], "clamp");
		const opacity = interpolate(snapIndex, [0, 3], [0.5, 1], "clamp");
		return {
			transform: [{ scale }],
			opacity,
		};
	});

	// Show current snap index as text
	const snapIndexTextStyle = useAnimatedStyle(() => {
		const { snapIndex } = animationProps.value;
		const color = interpolateColor(
			snapIndex,
			[0, 1, 2, 3],
			["#ef4444", "#f59e0b", "#22c55e", "#3b82f6"],
		);
		return { color };
	});

	return (
		<Animated.View style={[styles.container, containerStyle]}>
			<SafeAreaView style={styles.safeArea} edges={["top"]}>
				<View style={styles.content}>
					<View style={styles.handle} />
					<ScreenHeader
						title="Snap Index Animation"
						subtitle="The snapIndex value interpolates between snap points. Drag or tap to see animations respond to the current position."
					/>

					<View style={styles.indicatorContainer}>
						<Animated.View style={[styles.indicator, indicatorStyle]}>
							<Animated.Text style={[styles.indicatorText, snapIndexTextStyle]}>
								snapIndex
							</Animated.Text>
						</Animated.View>
					</View>

					<Text style={styles.sectionLabel}>Tap to snap:</Text>
					<View style={styles.buttons}>
						{SNAP_POINTS.map(({ index, label, color }) => (
							<Pressable
								key={index}
								testID={`snap-to-${index}`}
								style={[styles.button, { borderColor: color }]}
								onPress={() => snapTo(index)}
							>
								<Text style={[styles.buttonText, { color }]}>{label}</Text>
							</Pressable>
						))}
					</View>

					<View style={styles.infoBox}>
						<Text style={styles.infoTitle}>How it works:</Text>
						<Text style={styles.infoText}>
							The snapIndex value smoothly interpolates between snap point
							indices as you drag. For example, when halfway between snap point
							0 (25%) and snap point 1 (50%), snapIndex = 0.5
						</Text>
					</View>
				</View>
			</SafeAreaView>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
	},
	safeArea: {
		flex: 1,
	},
	content: {
		flex: 1,
		padding: 20,
		alignItems: "center",
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		marginBottom: 20,
	},
	indicatorContainer: {
		marginVertical: 30,
		alignItems: "center",
	},
	indicator: {
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: "rgba(255,255,255,0.1)",
		borderWidth: 2,
		borderColor: "rgba(255,255,255,0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
	indicatorText: {
		fontSize: 16,
		fontWeight: "700",
	},
	sectionLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: "rgba(255,255,255,0.5)",
		marginBottom: 12,
		alignSelf: "flex-start",
	},
	buttons: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 30,
	},
	button: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 8,
		borderWidth: 2,
		backgroundColor: "rgba(255,255,255,0.05)",
	},
	buttonText: {
		fontSize: 14,
		fontWeight: "600",
	},
	infoBox: {
		backgroundColor: "rgba(255,255,255,0.05)",
		padding: 16,
		borderRadius: 12,
		width: "100%",
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "rgba(255,255,255,0.8)",
		marginBottom: 8,
	},
	infoText: {
		fontSize: 13,
		color: "rgba(255,255,255,0.6)",
		lineHeight: 20,
	},
});
