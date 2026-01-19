import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

/**
 * Leaf screen with horizontal gesture.
 * Parent has vertical gesture.
 * Both should work independently (no conflict).
 *
 * Test:
 * - Swipe → should dismiss this screen only
 * - Swipe ↓ should dismiss entire stack (including this screen)
 * - Swipe ← ↑ should do nothing
 */
export default function LeafScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Leaf Screen"
				subtitle="gestureDirection: horizontal"
			/>

			<View style={styles.content}>
				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>
						Horizontal gesture on this screen
					</Text>
					<Text style={styles.infoText}>
						This screen has horizontal gesture. The parent stack has vertical.
						Both axes work independently!
					</Text>
				</View>

				<View style={styles.instructions}>
					<Text style={styles.instructionTitle}>Try these gestures:</Text>
					<View style={styles.gestureRow}>
						<Text style={styles.gestureIcon}>→</Text>
						<Text style={styles.gestureText}>
							Swipe right → Dismisses this screen only
						</Text>
					</View>
					<View style={styles.gestureRow}>
						<Text style={styles.gestureIcon}>↓</Text>
						<Text style={styles.gestureText}>
							Swipe down → Dismisses entire stack
						</Text>
					</View>
					<View style={[styles.gestureRow, styles.inactive]}>
						<Text style={styles.gestureIcon}>↑</Text>
						<Text style={styles.gestureTextInactive}>Swipe up → Nothing</Text>
					</View>
					<View style={[styles.gestureRow, styles.inactive]}>
						<Text style={styles.gestureIcon}>←</Text>
						<Text style={styles.gestureTextInactive}>Swipe left → Nothing</Text>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1b4e2d",
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
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		padding: 12,
		borderRadius: 8,
	},
	inactive: {
		backgroundColor: "rgba(255, 255, 255, 0.03)",
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
		flex: 1,
	},
	gestureTextInactive: {
		fontSize: 14,
		color: "rgba(255, 255, 255, 0.4)",
		flex: 1,
	},
});
