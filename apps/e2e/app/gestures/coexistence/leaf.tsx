import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

/**
 * Leaf with vertical gesture, parent has vertical-inverted.
 * BOTH gestures work - no conflict because they're different directions.
 *
 * Test:
 * - Swipe ↓ dismisses ONLY this leaf
 * - Swipe ↑ dismisses ENTIRE stack (inherited from parent)
 */
export default function LeafScreen() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader title="Leaf Screen" subtitle="Has vertical (↓ dismisses)" />

			<View style={styles.content}>
				<View
					style={[styles.infoBox, { backgroundColor: theme.infoBox }]}
				>
					<Text style={[styles.infoTitle, { color: theme.text }]}>
						Two Directions, No Conflict
					</Text>
					<Text style={[styles.infoText, { color: theme.textSecondary }]}>
						This screen has vertical (↓) and the parent has vertical-inverted
						(↑). Both work because they are DIFFERENT directions!
					</Text>
				</View>

				<View style={styles.instructions}>
					<Text
						style={[styles.instructionTitle, { color: theme.textTertiary }]}
					>
						Try BOTH gestures:
					</Text>
					<View
						style={[
							styles.gestureRow,
							{ backgroundColor: theme.surfaceElevated },
						]}
					>
						<Text style={[styles.gestureIcon, { color: theme.activePill }]}>
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
								Dismisses ONLY this leaf (back to index)
							</Text>
						</View>
					</View>
					<View
						style={[
							styles.gestureRow,
							{ backgroundColor: theme.surfaceElevated },
						]}
					>
						<Text style={[styles.gestureIcon, { color: theme.activePill }]}>
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
								Dismisses ENTIRE stack (back to gestures home)
							</Text>
						</View>
					</View>
				</View>

				<View
					style={[styles.keyPoint, { backgroundColor: theme.noteBox }]}
				>
					<Text style={[styles.keyPointTitle, { color: theme.noteText }]}>
						Key Insight
					</Text>
					<Text
						style={[styles.keyPointText, { color: theme.textSecondary }]}
					>
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
	},
	content: {
		flex: 1,
		padding: 16,
		gap: 24,
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
		gap: 12,
	},
	instructionTitle: {
		fontSize: 14,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 1,
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
		marginTop: 4,
	},
	keyPoint: {
		borderRadius: 14,
		padding: 16,
	},
	keyPointTitle: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
	},
	keyPointText: {
		fontSize: 13,
		lineHeight: 20,
	},
});
