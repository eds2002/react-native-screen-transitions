import { StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

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
	const theme = useTheme();

	return (
		<View style={styles.container}>
			<View
				style={[styles.drawer, { backgroundColor: theme.card }]}
			>
				<View style={[styles.handle, { backgroundColor: theme.handle }]} />
				<ScreenHeader
					title="Right Drawer"
					subtitle="snapPoints: [0.5, 0.8], horizontal"
				/>

				<View style={styles.content}>
					<View
						style={[styles.infoBox, { backgroundColor: theme.infoBox }]}
					>
						<Text style={[styles.infoTitle, { color: theme.text }]}>
							Drawer Owns Horizontal
						</Text>
						<Text
							style={[styles.infoText, { color: theme.textSecondary }]}
						>
							This drawer claims horizontal and horizontal-inverted. But
							vertical is free, so it inherits from the parent stack.
						</Text>
					</View>

					<View style={styles.instructions}>
						<Text
							style={[
								styles.instructionTitle,
								{ color: theme.textTertiary },
							]}
						>
							Drawer gestures (owned):
						</Text>
						<View
							style={[
								styles.gestureRow,
								{ backgroundColor: theme.surfaceElevated },
							]}
						>
							<Text
								style={[styles.gestureIcon, { color: theme.activePill }]}
							>
								→
							</Text>
							<View style={styles.gestureContent}>
								<Text style={[styles.gestureText, { color: theme.text }]}>
									Swipe right
								</Text>
								<Text
									style={[
										styles.gestureResult,
										{ color: theme.textSecondary },
									]}
								>
									Dismiss drawer (back to index)
								</Text>
							</View>
						</View>
						<View
							style={[
								styles.gestureRow,
								{ backgroundColor: theme.surfaceElevated },
							]}
						>
							<Text
								style={[styles.gestureIcon, { color: theme.activePill }]}
							>
								←
							</Text>
							<View style={styles.gestureContent}>
								<Text style={[styles.gestureText, { color: theme.text }]}>
									Swipe left
								</Text>
								<Text
									style={[
										styles.gestureResult,
										{ color: theme.textSecondary },
									]}
								>
									Expand to 0.8
								</Text>
							</View>
						</View>
					</View>

					<View style={styles.instructions}>
						<Text
							style={[
								styles.instructionTitle,
								{ color: theme.textTertiary },
							]}
						>
							Inherited from parent:
						</Text>
						<View
							style={[
								styles.gestureRow,
								{ backgroundColor: theme.noteBox },
							]}
						>
							<Text
								style={[styles.gestureIcon, { color: theme.noteText }]}
							>
								↓
							</Text>
							<View style={styles.gestureContent}>
								<Text style={[styles.gestureText, { color: theme.text }]}>
									Swipe down
								</Text>
								<Text
									style={[
										styles.gestureResult,
										{ color: theme.textSecondary },
									]}
								>
									Dismisses ENTIRE parent stack
								</Text>
							</View>
						</View>
					</View>

					<View
						style={[
							styles.noteBox,
							{ backgroundColor: theme.surfaceElevated },
						]}
					>
						<Text
							style={[styles.noteTitle, { color: theme.textTertiary }]}
						>
							Key Insight
						</Text>
						<Text
							style={[styles.noteText, { color: theme.textSecondary }]}
						>
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
		borderRadius: 14,
		padding: 16,
	},
	infoTitle: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 8,
	},
	infoText: {
		fontSize: 14,
		lineHeight: 20,
	},
	instructions: {
		gap: 8,
	},
	instructionTitle: {
		fontSize: 12,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 4,
	},
	gestureRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
		padding: 12,
		borderRadius: 8,
	},
	gestureIcon: {
		fontSize: 24,
		width: 36,
		textAlign: "center",
	},
	gestureContent: {
		flex: 1,
	},
	gestureText: {
		fontSize: 14,
		fontWeight: "600",
	},
	gestureResult: {
		fontSize: 13,
		marginTop: 2,
	},
	noteBox: {
		borderRadius: 14,
		padding: 16,
	},
	noteTitle: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
	},
	noteText: {
		fontSize: 13,
		lineHeight: 20,
	},
});
