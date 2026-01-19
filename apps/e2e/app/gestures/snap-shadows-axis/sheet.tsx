import { StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "@/components/screen-header";

/**
 * Bottom sheet with snap points [0.5, 0.8].
 * Claims both vertical AND vertical-inverted (shadows parent completely).
 *
 * Test at each snap position:
 *
 * At 0.5 (min snap):
 *   - ↓ dismisses sheet to 0
 *   - ↑ expands to 0.8
 *
 * At 0.8 (max snap):
 *   - ↓ collapses to 0.5
 *   - ↑ does nothing (already at max)
 */
export default function SheetScreen() {
	return (
		<View style={styles.container}>
			<View style={styles.sheet}>
				<View style={styles.handle} />
				<ScreenHeader title="Bottom Sheet" subtitle="snapPoints: [0.5, 0.8]" />

				<View style={styles.content}>
					<View style={styles.infoBox}>
						<Text style={styles.infoTitle}>Sheet Claims Both Directions</Text>
						<Text style={styles.infoText}>
							This sheet has snapPoints, so it claims BOTH vertical and
							vertical-inverted. The parent's vertical gesture is completely
							shadowed.
						</Text>
					</View>

					<View style={styles.snapInfo}>
						<Text style={styles.snapTitle}>Current Snap: 0.5 (50%)</Text>
						<Text style={styles.snapText}>
							Starting position. Try gestures:
						</Text>
					</View>

					<View style={styles.instructions}>
						<View style={styles.gestureRow}>
							<Text style={styles.gestureIcon}>↓</Text>
							<View style={styles.gestureContent}>
								<Text style={styles.gestureText}>Swipe down</Text>
								<Text style={styles.gestureResult}>
									Dismiss sheet (back to index)
								</Text>
							</View>
						</View>
						<View style={styles.gestureRow}>
							<Text style={styles.gestureIcon}>↑</Text>
							<View style={styles.gestureContent}>
								<Text style={styles.gestureText}>Swipe up</Text>
								<Text style={styles.gestureResult}>Expand to 0.8 (80%)</Text>
							</View>
						</View>
					</View>

					<View style={styles.noteBox}>
						<Text style={styles.noteTitle}>Parent is Shadowed</Text>
						<Text style={styles.noteText}>
							The parent stack has vertical gesture, but this sheet shadows it.
							Swiping ↓ affects the sheet, NOT the parent stack.
						</Text>
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-end",
	},
	sheet: {
		backgroundColor: "#2e1b4e",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingTop: 12,
		paddingBottom: 40,
		flex: 1,
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		alignSelf: "center",
		marginBottom: 8,
	},
	content: {
		flex: 1,
		padding: 16,
		gap: 16,
	},
	infoBox: {
		backgroundColor: "rgba(255, 74, 158, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 74, 158, 0.3)",
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#ff4a9e",
		marginBottom: 8,
	},
	infoText: {
		fontSize: 14,
		color: "rgba(255, 255, 255, 0.7)",
		lineHeight: 20,
	},
	snapInfo: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 12,
		padding: 16,
	},
	snapTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 4,
	},
	snapText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.6)",
	},
	instructions: {
		gap: 8,
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
		color: "#ff4a9e",
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
		marginTop: 2,
	},
	noteBox: {
		backgroundColor: "rgba(255, 193, 7, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 193, 7, 0.3)",
	},
	noteTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#ffc107",
		marginBottom: 8,
	},
	noteText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.7)",
		lineHeight: 20,
	},
});
