import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	interpolate,
	interpolateColor,
	useAnimatedStyle,
} from "react-native-reanimated";
import { snapTo, useScreenAnimation } from "react-native-screen-transitions";
import { useTheme } from "@/theme";

export default function AutoSnapScreen() {
	const animation = useScreenAnimation();
	const theme = useTheme();

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
			<View style={[styles.handle, { backgroundColor: theme.handle }]} />

			<View style={styles.header}>
				<Text style={[styles.eyebrow, { color: theme.actionButton }]}>Intrinsic Sheet</Text>
				<Text style={[styles.title, { color: theme.text }]}>Auto Snap Detent</Text>
				<Animated.Text style={[styles.subtitle, { color: theme.textSecondary }, subtitleStyle]}>
					Starts at content height, then expands to a full-screen detail view.
				</Animated.Text>
			</View>

			<Animated.View style={[styles.detentChip, detentChipStyle]}>
				<Animated.Text style={[styles.detentLabel, detentLabelStyle]}>
					Auto detent = index 0 · Full detent = index 1
				</Animated.Text>
			</Animated.View>

			<Animated.View style={[styles.heroCard, { backgroundColor: theme.card }, heroStyle]}>
				<View style={[styles.heroIcon, { backgroundColor: theme.surfaceElevated }]}>
					<Ionicons name="sparkles" size={26} color={theme.text} />
				</View>
				<View style={styles.heroBody}>
					<Text style={[styles.heroTitle, { color: theme.text }]}>Review-ready sheet content</Text>
					<Text style={[styles.heroText, { color: theme.textSecondary }]}>
						This card is intentionally tall enough to make the auto detent
						visible, but not so tall that it looks like a full-screen modal.
					</Text>
				</View>
			</Animated.View>

			<View style={styles.metrics}>
				<View style={[styles.metricCard, { backgroundColor: theme.surfaceElevated }]}>
					<Text style={[styles.metricValue, { color: theme.text }]}>Auto</Text>
					<Text style={[styles.metricLabel, { color: theme.textTertiary }]}>Initial detent</Text>
				</View>
				<View style={[styles.metricCard, { backgroundColor: theme.surfaceElevated }]}>
					<Text style={[styles.metricValue, { color: theme.text }]}>Full</Text>
					<Text style={[styles.metricLabel, { color: theme.textTertiary }]}>Expanded detent</Text>
				</View>
				<View style={[styles.metricCard, { backgroundColor: theme.surfaceElevated }]}>
					<Text style={[styles.metricValue, { color: theme.text }]}>2</Text>
					<Text style={[styles.metricLabel, { color: theme.textTertiary }]}>Snap points</Text>
				</View>
			</View>

			<View style={[styles.detailBlock, { backgroundColor: theme.infoBox }]}>
				<View style={styles.detailRow}>
					<Ionicons name="resize" size={18} color={theme.actionButton} />
					<Text style={[styles.detailText, { color: theme.textSecondary }]}>
						Auto mode measures this sheet from its intrinsic content height.
					</Text>
				</View>
				<View style={styles.detailRow}>
					<Ionicons name="expand" size={18} color={theme.actionButton} />
					<Text style={[styles.detailText, { color: theme.textSecondary }]}>
						Drag upward or tap Full to expand to the 100% detent.
					</Text>
				</View>
				<View style={styles.detailRow}>
					<Ionicons name="contract" size={18} color={theme.actionButton} />
					<Text style={[styles.detailText, { color: theme.textSecondary }]}>
						Drag down or tap Auto to settle back to intrinsic height.
					</Text>
				</View>
			</View>

			<View style={styles.controls}>
				<Pressable
					testID="auto-snap-to-auto"
					style={({ pressed }) => [styles.controlButton, { backgroundColor: pressed ? theme.secondaryButtonPressed : theme.secondaryButton }]}
					onPress={() => snapTo(0)}
				>
					<Text style={[styles.secondaryButtonText, { color: theme.secondaryButtonText }]}>Auto</Text>
				</Pressable>
				<Pressable
					testID="auto-snap-to-full"
					style={({ pressed }) => [styles.controlButton, { backgroundColor: pressed ? theme.actionButtonPressed : theme.actionButton }]}
					onPress={() => snapTo(1)}
				>
					<Text style={[styles.primaryButtonText, { color: theme.actionButtonText }]}>Full</Text>
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
		marginBottom: 8,
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 15,
		fontWeight: "600",
		lineHeight: 22,
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
	},
	heroIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
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
	},
	heroText: {
		fontSize: 14,
		fontWeight: "600",
		lineHeight: 21,
	},
	metrics: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 16,
	},
	metricCard: {
		flex: 1,
		borderRadius: 18,
		paddingVertical: 14,
		paddingHorizontal: 12,
	},
	metricValue: {
		fontSize: 17,
		fontWeight: "900",
		marginBottom: 4,
	},
	metricLabel: {
		fontSize: 11,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.4,
	},
	detailBlock: {
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
	},
	controls: {
		flexDirection: "row",
		gap: 12,
	},
	controlButton: {
		flex: 1,
		height: 48,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButtonText: {
		fontSize: 15,
		fontWeight: "900",
	},
	secondaryButtonText: {
		fontSize: 15,
		fontWeight: "900",
	},
});
