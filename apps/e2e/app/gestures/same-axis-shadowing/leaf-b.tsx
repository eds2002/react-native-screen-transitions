import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

/**
 * Leaf B - Has vertical gesture (SHADOWS parent)
 *
 * Because this screen has its OWN vertical gesture config, it SHADOWS
 * the parent's vertical gesture. Swiping down will only dismiss this screen,
 * NOT the entire stack.
 */
export default function LeafBScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader title="Leaf B" subtitle="Has vertical (shadows parent)" />

			<View style={styles.content}>
				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>This screen has vertical gesture</Text>
					<Text style={styles.infoText}>
						Because it claims the same direction as the parent, it SHADOWS the
						parent's gesture. The parent's vertical gesture is blocked.
					</Text>
				</View>

				<View style={styles.resultBox}>
					<Text style={styles.resultTitle}>Expected Result</Text>
					<View style={styles.gestureRow}>
						<Text style={styles.gestureIcon}>↓</Text>
						<View style={styles.gestureContent}>
							<Text style={styles.gestureText}>Swipe down</Text>
							<Text style={styles.gestureResult}>
								Dismisses ONLY this screen (back to index)
							</Text>
						</View>
					</View>
				</View>

				<View style={styles.shadowBox}>
					<Text style={styles.shadowTitle}>Shadowing Explained</Text>
					<Text style={styles.shadowText}>
						The parent also has vertical gesture, but this screen "shadows" it
						by claiming the same direction. Only ONE owner per direction at any
						given time.
					</Text>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#4e1b2d",
	},
	content: {
		flex: 1,
		padding: 16,
		gap: 24,
	},
	infoBox: {
		backgroundColor: "rgba(158, 74, 255, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(158, 74, 255, 0.3)",
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#9e4aff",
		marginBottom: 8,
	},
	infoText: {
		fontSize: 14,
		color: "rgba(255, 255, 255, 0.7)",
		lineHeight: 20,
	},
	resultBox: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 12,
		padding: 16,
	},
	resultTitle: {
		fontSize: 12,
		fontWeight: "600",
		color: "#888",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 12,
	},
	gestureRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		padding: 12,
		borderRadius: 8,
	},
	gestureIcon: {
		fontSize: 24,
		color: "#9e4aff",
		width: 36,
		textAlign: "center",
	},
	gestureContent: {
		flex: 1,
	},
	gestureText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#fff",
	},
	gestureResult: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.6)",
		marginTop: 4,
	},
	shadowBox: {
		backgroundColor: "rgba(255, 193, 7, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 193, 7, 0.3)",
	},
	shadowTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#ffc107",
		marginBottom: 8,
	},
	shadowText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.7)",
		lineHeight: 20,
	},
});
