import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

/**
 * Leaf screen with NO gesture config.
 * Should inherit vertical from parent layout.
 *
 * Test:
 * - Swipe ↓ should dismiss this screen (inherited from parent)
 * - Swipe ↑ → ← should do nothing
 */
export default function LeafScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader title="Leaf Screen" subtitle="No gesture config" />

			<View style={styles.content}>
				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>
						This screen has no gesture config
					</Text>
					<Text style={styles.infoText}>
						It inherits the vertical gesture from its parent layout.
					</Text>
				</View>

				<View style={styles.instructions}>
					<Text style={styles.instructionTitle}>Try these gestures:</Text>
					<View style={styles.gestureRow}>
						<Text style={styles.gestureIcon}>↓</Text>
						<Text style={styles.gestureText}>Swipe down → Should dismiss</Text>
					</View>
					<View style={styles.gestureRow}>
						<Text style={styles.gestureIcon}>↑</Text>
						<Text style={styles.gestureText}>Swipe up → Nothing</Text>
					</View>
					<View style={styles.gestureRow}>
						<Text style={styles.gestureIcon}>→</Text>
						<Text style={styles.gestureText}>Swipe right → Nothing</Text>
					</View>
					<View style={styles.gestureRow}>
						<Text style={styles.gestureIcon}>←</Text>
						<Text style={styles.gestureText}>Swipe left → Nothing</Text>
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
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		borderRadius: 12,
		padding: 16,
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
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
		alignItems: "center",
		gap: 12,
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		padding: 12,
		borderRadius: 8,
	},
	gestureIcon: {
		fontSize: 20,
		color: "#4a9eff",
		width: 30,
		textAlign: "center",
	},
	gestureText: {
		fontSize: 14,
		color: "#fff",
	},
});
