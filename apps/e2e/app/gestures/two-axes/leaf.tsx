import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

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
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Leaf Screen"
				subtitle="gestureDirection: horizontal"
			/>

			<View style={styles.content}>
				<View style={[styles.infoBox, { backgroundColor: theme.infoBox }]}>
					<Text style={[styles.infoTitle, { color: theme.text }]}>
						Horizontal gesture on this screen
					</Text>
					<Text style={[styles.infoText, { color: theme.textSecondary }]}>
						This screen has horizontal gesture. The parent stack has vertical.
						Both axes work independently!
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
							→
						</Text>
						<Text style={[styles.gestureText, { color: theme.text }]}>
							Swipe right → Dismisses this screen only
						</Text>
					</View>
					<View
						style={[
							styles.gestureRow,
							{ backgroundColor: theme.surfaceElevated },
						]}
					>
						<Text style={[styles.gestureIcon, { color: theme.activePill }]}>
							↓
						</Text>
						<Text style={[styles.gestureText, { color: theme.text }]}>
							Swipe down → Dismisses entire stack
						</Text>
					</View>
					<View style={[styles.gestureRow, { backgroundColor: theme.surface }]}>
						<Text style={[styles.gestureIcon, { color: theme.activePill }]}>
							↑
						</Text>
						<Text style={[styles.gestureText, { color: theme.textTertiary }]}>
							Swipe up → Nothing
						</Text>
					</View>
					<View style={[styles.gestureRow, { backgroundColor: theme.surface }]}>
						<Text style={[styles.gestureIcon, { color: theme.activePill }]}>
							←
						</Text>
						<Text style={[styles.gestureText, { color: theme.textTertiary }]}>
							Swipe left → Nothing
						</Text>
					</View>
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
});
