import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

/**
 * Leaf screen that inherits vertical-inverted from parent.
 *
 * Test:
 * - Swipe ↑ should dismiss (vertical-inverted = drag up)
 * - Swipe ↓ should do nothing
 */
export default function LeafScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["bottom"]}>
			<View style={styles.content}>
				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>Vertical-Inverted Gesture</Text>
					<Text style={styles.infoText}>
						This screen slides in from the TOP and is dismissed by swiping UP.
						This is the opposite of a normal bottom sheet.
					</Text>
				</View>

				<View style={styles.instructions}>
					<Text style={styles.instructionTitle}>Try these gestures:</Text>
					<View style={styles.gestureRow}>
						<Text style={styles.gestureIcon}>↑</Text>
						<Text style={styles.gestureText}>Swipe up → Dismisses</Text>
					</View>
					<View style={[styles.gestureRow, styles.inactive]}>
						<Text style={styles.gestureIcon}>↓</Text>
						<Text style={styles.gestureTextInactive}>
							Swipe down → Nothing (wrong direction)
						</Text>
					</View>
				</View>

				<View style={styles.directionBox}>
					<Text style={styles.directionTitle}>Direction Independence</Text>
					<Text style={styles.directionText}>
						vertical and vertical-inverted are completely independent. A screen
						claiming vertical does NOT shadow vertical-inverted, and vice versa.
					</Text>
				</View>
			</View>

			<ScreenHeader title="Leaf Screen" subtitle="Inherits vertical-inverted" />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#4e3a1b",
	},
	content: {
		flex: 1,
		padding: 16,
		gap: 24,
		justifyContent: "flex-end",
	},
	infoBox: {
		backgroundColor: "rgba(255, 158, 74, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 158, 74, 0.3)",
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#ff9e4a",
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
		color: "#ff9e4a",
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
	directionBox: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 12,
		padding: 16,
	},
	directionTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#888",
		marginBottom: 8,
	},
	directionText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.6)",
		lineHeight: 20,
	},
});
