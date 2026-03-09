import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	interpolate,
	interpolateColor,
	useAnimatedStyle,
} from "react-native-reanimated";
import { snapTo, useScreenAnimation } from "react-native-screen-transitions";

export default function AutoSnapScreen() {
	const animation = useScreenAnimation();

	const heroStyle = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		const scale = interpolate(snapIndex, [0, 1], [1, 1.06], "clamp");
		const backgroundColor = interpolateColor(
			snapIndex,
			[0, 1],
			["rgba(108,92,231,0.18)", "rgba(232,67,147,0.24)"],
		);

		return {
			transform: [{ scale }],
			backgroundColor,
		};
	});

	const subtitleStyle = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		return {
			opacity: interpolate(snapIndex, [0, 1], [0.78, 1], "clamp"),
		};
	});

	const detentChipStyle = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		const backgroundColor = interpolateColor(
			snapIndex,
			[0, 1],
			["rgba(255,255,255,0.08)", "rgba(0,184,148,0.18)"],
		);
		return { backgroundColor };
	});

	const detentLabelStyle = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		const color = interpolateColor(
			snapIndex,
			[0, 1],
			["rgba(255,255,255,0.72)", "#55EFC4"],
		);
		return { color };
	});

	return (
		<View style={styles.container}>
			<View style={styles.handle} />

			<View style={styles.header}>
				<Text style={styles.eyebrow}>Intrinsic Sheet</Text>
				<Text style={styles.title}>Auto Snap Detent</Text>
				<Animated.Text style={[styles.subtitle, subtitleStyle]}>
					Starts at content height, then expands to a full-screen detail view.
				</Animated.Text>
			</View>

			<Animated.View style={[styles.detentChip, detentChipStyle]}>
				<Animated.Text style={[styles.detentLabel, detentLabelStyle]}>
					Auto detent = index 0 · Full detent = index 1
				</Animated.Text>
			</Animated.View>

			<Animated.View style={[styles.heroCard, heroStyle]}>
				<View style={styles.heroIcon}>
					<Ionicons name="sparkles" size={26} color="#fff" />
				</View>
				<View style={styles.heroBody}>
					<Text style={styles.heroTitle}>Review-ready sheet content</Text>
					<Text style={styles.heroText}>
						This card is intentionally tall enough to make the auto detent
						visible, but not so tall that it looks like a full-screen modal.
					</Text>
				</View>
			</Animated.View>

			<View style={styles.metrics}>
				<View style={styles.metricCard}>
					<Text style={styles.metricValue}>Auto</Text>
					<Text style={styles.metricLabel}>Initial detent</Text>
				</View>
				<View style={styles.metricCard}>
					<Text style={styles.metricValue}>Full</Text>
					<Text style={styles.metricLabel}>Expanded detent</Text>
				</View>
				<View style={styles.metricCard}>
					<Text style={styles.metricValue}>2</Text>
					<Text style={styles.metricLabel}>Snap points</Text>
				</View>
			</View>

			<View style={styles.detailBlock}>
				<View style={styles.detailRow}>
					<Ionicons name="resize" size={18} color="#74B9FF" />
					<Text style={styles.detailText}>
						Auto mode measures this sheet from its intrinsic content height.
					</Text>
				</View>
				<View style={styles.detailRow}>
					<Ionicons name="expand" size={18} color="#55EFC4" />
					<Text style={styles.detailText}>
						Drag upward or tap Full to expand to the 100% detent.
					</Text>
				</View>
				<View style={styles.detailRow}>
					<Ionicons name="contract" size={18} color="#FDCB6E" />
					<Text style={styles.detailText}>
						Drag down or tap Auto to settle back to intrinsic height.
					</Text>
				</View>
			</View>

			<View style={styles.controls}>
				<Pressable
					testID="auto-snap-to-auto"
					style={[styles.controlButton, styles.secondaryButton]}
					onPress={() => snapTo(0)}
				>
					<Text style={styles.secondaryButtonText}>Auto</Text>
				</Pressable>
				<Pressable
					testID="auto-snap-to-full"
					style={[styles.controlButton, styles.primaryButton]}
					onPress={() => snapTo(1)}
				>
					<Text style={styles.primaryButtonText}>Full</Text>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		paddingTop: 12,
		paddingHorizontal: 20,
		paddingBottom: 28,
	},
	handle: {
		width: 44,
		height: 5,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 3,
		alignSelf: "center",
		marginBottom: 18,
	},
	header: {
		marginBottom: 14,
	},
	eyebrow: {
		fontSize: 12,
		fontWeight: "800",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: "#6C5CE7",
		marginBottom: 8,
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 15,
		fontWeight: "600",
		lineHeight: 22,
		color: "rgba(255,255,255,0.6)",
	},
	detentChip: {
		alignSelf: "flex-start",
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginBottom: 16,
	},
	detentLabel: {
		fontSize: 12,
		fontWeight: "800",
	},
	heroCard: {
		borderRadius: 22,
		padding: 18,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
	},
	heroIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "rgba(255,255,255,0.08)",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 14,
	},
	heroBody: {
		gap: 8,
	},
	heroTitle: {
		fontSize: 18,
		fontWeight: "900",
		color: "#fff",
	},
	heroText: {
		fontSize: 14,
		fontWeight: "600",
		lineHeight: 21,
		color: "rgba(255,255,255,0.62)",
	},
	metrics: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 16,
	},
	metricCard: {
		flex: 1,
		backgroundColor: "rgba(255,255,255,0.05)",
		borderRadius: 18,
		paddingVertical: 14,
		paddingHorizontal: 12,
	},
	metricValue: {
		fontSize: 17,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 4,
	},
	metricLabel: {
		fontSize: 11,
		fontWeight: "700",
		color: "rgba(255,255,255,0.42)",
		textTransform: "uppercase",
		letterSpacing: 0.4,
	},
	detailBlock: {
		backgroundColor: "rgba(255,255,255,0.04)",
		borderRadius: 20,
		padding: 16,
		gap: 12,
		marginBottom: 18,
	},
	detailRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 10,
	},
	detailText: {
		flex: 1,
		fontSize: 14,
		fontWeight: "600",
		lineHeight: 20,
		color: "rgba(255,255,255,0.58)",
	},
	controls: {
		flexDirection: "row",
		gap: 12,
	},
	controlButton: {
		flex: 1,
		height: 48,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButton: {
		backgroundColor: "#6C5CE7",
	},
	secondaryButton: {
		backgroundColor: "rgba(255,255,255,0.08)",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
	},
	primaryButtonText: {
		fontSize: 15,
		fontWeight: "900",
		color: "#fff",
	},
	secondaryButtonText: {
		fontSize: 15,
		fontWeight: "900",
		color: "rgba(255,255,255,0.82)",
	},
});
