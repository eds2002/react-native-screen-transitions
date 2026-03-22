import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

/**
 * Leaf A - No gesture config (inherits from parent)
 *
 * Because this screen has NO gesture config, it inherits the vertical
 * gesture from the parent layout. Swiping down will dismiss the ENTIRE stack.
 */
export default function LeafAScreen() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader title="Leaf A" subtitle="Inherits vertical from parent" />

			<View style={styles.content}>
				<View
					style={[styles.infoBox, { backgroundColor: theme.infoBox }]}
				>
					<Text style={[styles.infoTitle, { color: theme.text }]}>
						No gesture config on this screen
					</Text>
					<Text style={[styles.infoText, { color: theme.textSecondary }]}>
						This screen inherits the vertical gesture from the parent layout.
					</Text>
				</View>

				<View
					style={[styles.resultBox, { backgroundColor: theme.card }]}
				>
					<Text
						style={[styles.resultTitle, { color: theme.textTertiary }]}
					>
						Expected Result
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
								Dismisses ENTIRE stack (back to home)
							</Text>
						</View>
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
});
