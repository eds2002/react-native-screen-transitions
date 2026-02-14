import { router } from "expo-router";
import { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function SnapLockedNoBubbleSheet() {
	const [probeTaps, setProbeTaps] = useState(0);

	return (
		<View
			testID="snap-locked-no-bubble-sheet"
			style={[styles.container, { maxHeight: SCREEN_HEIGHT }]}
		>
			<View style={styles.handle} />
			<Text style={styles.title}>Locked + No Dismiss</Text>
			<Text style={styles.subtitle}>
				This sheet owns the vertical axis but cannot move or dismiss.
			</Text>

			<View style={styles.card}>
				<Text style={styles.cardTitle}>Manual verification</Text>
				<Text style={styles.cardLine}>
					- Swipe down repeatedly on this sheet.
				</Text>
				<Text style={styles.cardLine}>- Parent route should NOT dismiss.</Text>
				<Text style={styles.cardLine}>- Swipe up should also do nothing.</Text>
			</View>

			<Pressable
				testID="snap-locked-no-bubble-probe"
				style={styles.probeButton}
				onPress={() => setProbeTaps((count) => count + 1)}
			>
				<Text style={styles.probeTitle}>Interaction Probe</Text>
				<Text style={styles.probeCount}>Taps: {probeTaps}</Text>
			</Pressable>

			<Pressable
				testID="snap-locked-no-bubble-back"
				style={styles.backButton}
				onPress={() => router.back()}
			>
				<Text style={styles.backText}>Back</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 12,
		backgroundColor: "#2d1f40",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
	},
	handle: {
		alignSelf: "center",
		width: 44,
		height: 5,
		borderRadius: 3,
		backgroundColor: "rgba(255,255,255,0.24)",
		marginBottom: 16,
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 13,
		fontWeight: "600",
		color: "rgba(255,255,255,0.62)",
		marginBottom: 14,
	},
	card: {
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 14,
		padding: 12,
		marginBottom: 12,
	},
	cardTitle: {
		fontSize: 12,
		fontWeight: "800",
		color: "#d7beff",
		marginBottom: 8,
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	cardLine: {
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255,255,255,0.82)",
		marginBottom: 4,
	},
	probeButton: {
		backgroundColor: "rgba(200,160,255,0.22)",
		borderRadius: 14,
		paddingVertical: 14,
		paddingHorizontal: 14,
		marginBottom: 12,
	},
	probeTitle: {
		fontSize: 14,
		fontWeight: "800",
		color: "#f0e4ff",
		marginBottom: 4,
	},
	probeCount: {
		fontSize: 13,
		fontWeight: "700",
		color: "rgba(255,255,255,0.9)",
	},
	backButton: {
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 11,
		backgroundColor: "rgba(255,255,255,0.2)",
	},
	backText: {
		fontSize: 12,
		fontWeight: "800",
		color: "#fff",
		textTransform: "uppercase",
		letterSpacing: 0.6,
	},
});
