import { StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

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
	const theme = useTheme();

	return (
		<View style={styles.container}>
			<View
				style={[styles.sheet, { backgroundColor: theme.card }]}
			>
				<View style={[styles.handle, { backgroundColor: theme.handle }]} />
				<ScreenHeader title="Bottom Sheet" subtitle="snapPoints: [0.5, 0.8]" />

				<View style={styles.content}>
					<View
						style={[styles.infoBox, { backgroundColor: theme.infoBox }]}
					>
						<Text style={[styles.infoTitle, { color: theme.text }]}>
							Sheet Claims Both Directions
						</Text>
						<Text
							style={[styles.infoText, { color: theme.textSecondary }]}
						>
							This sheet has snapPoints, so it claims BOTH vertical and
							vertical-inverted. The parent's vertical gesture is completely
							shadowed.
						</Text>
					</View>

					<View
						style={[
							styles.snapInfo,
							{ backgroundColor: theme.surfaceElevated },
						]}
					>
						<Text style={[styles.snapTitle, { color: theme.text }]}>
							Current Snap: 0.5 (50%)
						</Text>
						<Text
							style={[styles.snapText, { color: theme.textSecondary }]}
						>
							Starting position. Try gestures:
						</Text>
					</View>

					<View style={styles.instructions}>
						<View
							style={[
								styles.gestureRow,
								{ backgroundColor: theme.surfaceElevated },
							]}
						>
							<Text
								style={[styles.gestureIcon, { color: theme.activePill }]}
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
									Dismiss sheet (back to index)
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
								↑
							</Text>
							<View style={styles.gestureContent}>
								<Text style={[styles.gestureText, { color: theme.text }]}>
									Swipe up
								</Text>
								<Text
									style={[
										styles.gestureResult,
										{ color: theme.textSecondary },
									]}
								>
									Expand to 0.8 (80%)
								</Text>
							</View>
						</View>
					</View>

					<View
						style={[styles.noteBox, { backgroundColor: theme.noteBox }]}
					>
						<Text style={[styles.noteTitle, { color: theme.noteText }]}>
							Parent is Shadowed
						</Text>
						<Text
							style={[styles.noteText, { color: theme.textSecondary }]}
						>
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
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingTop: 12,
		paddingBottom: 40,
		flex: 1,
	},
	handle: {
		width: 40,
		height: 4,
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
	snapInfo: {
		borderRadius: 14,
		padding: 16,
	},
	snapTitle: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 4,
	},
	snapText: {
		fontSize: 13,
	},
	instructions: {
		gap: 8,
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
