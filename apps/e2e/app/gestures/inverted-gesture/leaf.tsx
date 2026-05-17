import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

/**
 * Leaf screen that inherits vertical-inverted from parent.
 *
 * Test:
 * - Swipe ↑ should dismiss (vertical-inverted = drag up)
 * - Swipe ↓ should do nothing
 */
export default function LeafScreen() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["bottom"]}
		>
			<View style={styles.content}>
				<View style={[styles.infoBox, { backgroundColor: theme.infoBox }]}>
					<Text style={[styles.infoTitle, { color: theme.text }]}>
						Vertical-Inverted Gesture
					</Text>
					<Text style={[styles.infoText, { color: theme.textSecondary }]}>
						This screen slides in from the TOP and is dismissed by swiping UP.
						This is the opposite of a normal bottom sheet.
					</Text>
				</View>

				<View style={styles.instructions}>
					<Text
						style={[styles.instructionTitle, { color: theme.textTertiary }]}
					>
						Try these gestures:
					</Text>
					<View
						style={[
							styles.gestureRow,
							{ backgroundColor: theme.surfaceElevated },
						]}
					>
						<Text style={[styles.gestureIcon, { color: theme.activePill }]}>
							↑
						</Text>
						<Text style={[styles.gestureText, { color: theme.text }]}>
							Swipe up → Dismisses
						</Text>
					</View>
					<View style={[styles.gestureRow, { backgroundColor: theme.surface }]}>
						<Text style={[styles.gestureIcon, { color: theme.activePill }]}>
							↓
						</Text>
						<Text style={[styles.gestureText, { color: theme.textTertiary }]}>
							Swipe down → Nothing (wrong direction)
						</Text>
					</View>
				</View>

				<View style={[styles.directionBox, { backgroundColor: theme.card }]}>
					<Text style={[styles.directionTitle, { color: theme.textTertiary }]}>
						Direction Independence
					</Text>
					<Text style={[styles.directionText, { color: theme.textSecondary }]}>
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
	},
	content: {
		flex: 1,
		padding: 16,
		gap: 24,
		justifyContent: "flex-end",
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
		alignItems: "center",
		gap: 12,
		padding: 12,
		borderRadius: 8,
	},
	gestureIcon: {
		fontSize: 20,
		width: 30,
		textAlign: "center",
	},
	gestureText: {
		fontSize: 14,
		flex: 1,
	},
	directionBox: {
		borderRadius: 14,
		padding: 16,
	},
	directionTitle: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
	},
	directionText: {
		fontSize: 13,
		lineHeight: 20,
	},
});
