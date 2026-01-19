import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

/**
 * Leaf with vertical gesture, parent has vertical-inverted.
 * BOTH gestures work - no conflict because they're different directions.
 *
 * Test:
 * - Swipe ↓ dismisses ONLY this leaf
 * - Swipe ↑ dismisses ENTIRE stack (inherited from parent)
 */
export default function LeafScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader title="Leaf Screen" subtitle="Has vertical (↓ dismisses)" />

			<View style={styles.content}>
				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>Two Directions, No Conflict</Text>
					<Text style={styles.infoText}>
						This screen has vertical (↓) and the parent has vertical-inverted
						(↑). Both work because they are DIFFERENT directions!
					</Text>
				</View>

				<View style={styles.instructions}>
					<Text style={styles.instructionTitle}>Try BOTH gestures:</Text>
					<View style={styles.gestureRow}>
						<Text style={styles.gestureIcon}>↓</Text>
						<View style={styles.gestureContent}>
							<Text style={styles.gestureText}>Swipe down</Text>
							<Text style={styles.gestureResult}>
								Dismisses ONLY this leaf (back to index)
							</Text>
						</View>
					</View>
					<View style={styles.gestureRow}>
						<Text style={styles.gestureIcon}>↑</Text>
						<View style={styles.gestureContent}>
							<Text style={styles.gestureText}>Swipe up</Text>
							<Text style={styles.gestureResult}>
								Dismisses ENTIRE stack (back to gestures home)
							</Text>
						</View>
					</View>
				</View>

				<View style={styles.keyPoint}>
					<Text style={styles.keyPointTitle}>Key Insight</Text>
					<Text style={styles.keyPointText}>
						This is NOT shadowing! Shadowing only happens when a child claims
						the SAME direction as an ancestor. Here, the child claims vertical
						(↓) and the parent claims vertical-inverted (↑). They coexist
						peacefully.
					</Text>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#2e4e1b",
	},
	content: {
		flex: 1,
		padding: 16,
		gap: 24,
	},
	infoBox: {
		backgroundColor: "rgba(158, 255, 74, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(158, 255, 74, 0.3)",
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#9eff4a",
		marginBottom: 8,
	},
	infoText: {
		fontSize: 14,
		color: "rgba(255, 255, 255, 0.7)",
		lineHeight: 20,
	},
	instructions: {
		gap: 12,
	},
	instructionTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#888",
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	gestureRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		padding: 12,
		borderRadius: 8,
	},
	gestureIcon: {
		fontSize: 24,
		color: "#9eff4a",
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
	keyPoint: {
		backgroundColor: "rgba(255, 193, 7, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 193, 7, 0.3)",
	},
	keyPointTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#ffc107",
		marginBottom: 8,
	},
	keyPointText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.7)",
		lineHeight: 20,
	},
});
