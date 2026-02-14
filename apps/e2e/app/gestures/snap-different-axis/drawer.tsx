import { StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "@/components/screen-header";

/**
 * Right drawer (horizontal) with snap points [0.5, 0.8].
 * Claims horizontal axis, but inherits vertical from parent.
 *
 * Test:
 *   - → collapse/dismiss drawer
 *   - ← expand drawer
 *   - ↓ dismisses ENTIRE parent stack (inherited)
 *   - ↑ nothing
 */
export default function DrawerScreen() {
	return (
		<View style={styles.container}>
			<View style={styles.drawer}>
				<View style={styles.handle} />
				<ScreenHeader
					title="Right Drawer"
					subtitle="snapPoints: [0.5, 0.8], horizontal"
				/>

				<View style={styles.content}>
					<View style={styles.infoBox}>
						<Text style={styles.infoTitle}>Drawer Owns Horizontal</Text>
						<Text style={styles.infoText}>
							This drawer claims horizontal and horizontal-inverted. But
							vertical is free, so it inherits from the parent stack.
						</Text>
					</View>

					<View style={styles.instructions}>
						<Text style={styles.instructionTitle}>
							Drawer gestures (owned):
						</Text>
						<View style={styles.gestureRow}>
							<Text style={styles.gestureIcon}>→</Text>
							<View style={styles.gestureContent}>
								<Text style={styles.gestureText}>Swipe right</Text>
								<Text style={styles.gestureResult}>
									Dismiss drawer (back to index)
								</Text>
							</View>
						</View>
						<View style={styles.gestureRow}>
							<Text style={styles.gestureIcon}>←</Text>
							<View style={styles.gestureContent}>
								<Text style={styles.gestureText}>Swipe left</Text>
								<Text style={styles.gestureResult}>Expand to 0.8</Text>
							</View>
						</View>
					</View>

					<View style={styles.instructions}>
						<Text style={styles.instructionTitle}>Inherited from parent:</Text>
						<View style={[styles.gestureRow, styles.inheritedRow]}>
							<Text style={[styles.gestureIcon, styles.inheritedIcon]}>↓</Text>
							<View style={styles.gestureContent}>
								<Text style={styles.gestureText}>Swipe down</Text>
								<Text style={styles.gestureResult}>
									Dismisses ENTIRE parent stack
								</Text>
							</View>
						</View>
					</View>

					<View style={styles.noteBox}>
						<Text style={styles.noteTitle}>Key Insight</Text>
						<Text style={styles.noteText}>
							Snap points on horizontal drawer only shadow the horizontal axis.
							The vertical axis is completely independent and follows normal
							inheritance rules.
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
		flexDirection: "row",
	},
	drawer: {
		backgroundColor: "#1b3a4e",
		borderTopLeftRadius: 24,
		borderBottomLeftRadius: 24,
		paddingLeft: 12,
		paddingRight: 20,
		paddingVertical: 20,
		flex: 1,
	},
	handle: {
		width: 4,
		height: 40,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		position: "absolute",
		left: 8,
		top: "50%",
		marginTop: -20,
	},
	content: {
		flex: 1,
		paddingHorizontal: 8,
		gap: 16,
	},
	infoBox: {
		backgroundColor: "rgba(74, 255, 255, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(74, 255, 255, 0.3)",
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#4affff",
		marginBottom: 8,
	},
	infoText: {
		fontSize: 14,
		color: "rgba(255, 255, 255, 0.7)",
		lineHeight: 20,
	},
	instructions: {
		gap: 8,
	},
	instructionTitle: {
		fontSize: 12,
		fontWeight: "600",
		color: "#888",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 4,
	},
	gestureRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
		backgroundColor: "rgba(255, 255, 255, 0.1)",
		padding: 12,
		borderRadius: 8,
	},
	inheritedRow: {
		backgroundColor: "rgba(255, 193, 7, 0.1)",
		borderWidth: 1,
		borderColor: "rgba(255, 193, 7, 0.3)",
	},
	gestureIcon: {
		fontSize: 24,
		color: "#4affff",
		width: 36,
		textAlign: "center",
	},
	inheritedIcon: {
		color: "#ffc107",
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
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 12,
		padding: 16,
	},
	noteTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#888",
		marginBottom: 8,
	},
	noteText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.6)",
		lineHeight: 20,
	},
});
