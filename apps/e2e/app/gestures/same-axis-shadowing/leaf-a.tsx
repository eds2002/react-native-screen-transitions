import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

/**
 * Leaf A - No gesture config (inherits from parent)
 *
 * Because this screen has NO gesture config, it inherits the vertical
 * gesture from the parent layout. Swiping down will dismiss the ENTIRE stack.
 */
export default function LeafAScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader title="Leaf A" subtitle="Inherits vertical from parent" />

			<View style={styles.content}>
				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>No gesture config on this screen</Text>
					<Text style={styles.infoText}>
						This screen inherits the vertical gesture from the parent layout.
					</Text>
				</View>

				<View style={styles.resultBox}>
					<Text style={styles.resultTitle}>Expected Result</Text>
					<View style={styles.gestureRow}>
						<Text style={styles.gestureIcon}>↓</Text>
						<View style={styles.gestureContent}>
							<Text style={styles.gestureText}>Swipe down</Text>
							<Text style={styles.gestureResult}>
								Dismisses ENTIRE stack (back to home)
							</Text>
						</View>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#2d1b4e",
	},
	content: {
		flex: 1,
		padding: 16,
		gap: 24,
	},
	infoBox: {
		backgroundColor: "rgba(74, 158, 255, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(74, 158, 255, 0.3)",
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#4a9eff",
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
		color: "#4a9eff",
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
});
