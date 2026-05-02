import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

/**
 * Leaf B - Has vertical gesture (SHADOWS parent)
 *
 * Because this screen has its OWN vertical gesture config, it SHADOWS
 * the parent's vertical gesture. Swiping down will only dismiss this screen,
 * NOT the entire stack.
 */
export default function LeafBScreen() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader title="Leaf B" subtitle="Has vertical (shadows parent)" />

			<View style={styles.content}>
				<View style={[styles.infoBox, { backgroundColor: theme.infoBox }]}>
					<Text style={[styles.infoTitle, { color: theme.text }]}>
						This screen has vertical gesture
					</Text>
					<Text style={[styles.infoText, { color: theme.textSecondary }]}>
						Because it claims the same direction as the parent, it SHADOWS the
						parent's gesture. The parent's vertical gesture is blocked.
					</Text>
				</View>

				<View style={[styles.resultBox, { backgroundColor: theme.card }]}>
					<Text style={[styles.resultTitle, { color: theme.textTertiary }]}>
						Expected Result
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
								style={[styles.gestureResult, { color: theme.textSecondary }]}
							>
								Dismisses ONLY this screen (back to index)
							</Text>
						</View>
					</View>
				</View>

				<View style={[styles.shadowBox, { backgroundColor: theme.noteBox }]}>
					<Text style={[styles.shadowTitle, { color: theme.noteText }]}>
						Shadowing Explained
					</Text>
					<Text style={[styles.shadowText, { color: theme.textSecondary }]}>
						The parent also has vertical gesture, but this screen "shadows" it
						by claiming the same direction. Only ONE owner per direction at any
						given time.
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
	resultBox: {
		borderRadius: 14,
		padding: 16,
	},
	resultTitle: {
		fontSize: 12,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 12,
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
	shadowBox: {
		borderRadius: 14,
		padding: 16,
	},
	shadowTitle: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
	},
	shadowText: {
		fontSize: 13,
		lineHeight: 20,
	},
});
