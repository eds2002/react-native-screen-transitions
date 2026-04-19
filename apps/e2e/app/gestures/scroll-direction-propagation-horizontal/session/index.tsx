import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

/**
 * Session screen — inherits horizontal gesture from the parent route.
 *
 * Test:
 * - Swipe → should dismiss (horizontal owner)
 * - Navigate to drawer to test horizontal ScrollView multi-owner coordination
 */
export default function HorizontalSessionScreen() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Horizontal Session"
				subtitle="Inherits horizontal from parent route"
			/>

			<View style={styles.content}>
				<View
					style={[styles.infoBox, { backgroundColor: theme.infoBox }]}
				>
					<Text style={[styles.infoTitle, { color: theme.text }]}>
						Current Gesture Ownership
					</Text>
					<Text style={[styles.infoText, { color: theme.textSecondary }]}>
						This screen does not configure its own gesture. It inherits{" "}
						<Text style={[styles.highlight, { color: theme.activePill }]}>
							horizontal
						</Text>{" "}
						from the parent route.
						{"\n\n"}
						Swipe → to dismiss back to the entry screen.
					</Text>
				</View>

				<View
					style={[
						styles.instructions,
						{ backgroundColor: theme.card },
					]}
				>
					<Text
						style={[
							styles.instructionTitle,
							{ color: theme.textTertiary },
						]}
					>
						Next step
					</Text>
					<Text
						style={[
							styles.instructionText,
							{ color: theme.textSecondary },
						]}
					>
						Open the drawer to test horizontal ScrollView coordination with two
						gesture owners on the same axis.
					</Text>
				</View>
			</View>

			<View style={styles.actions}>
				<Pressable
					style={({ pressed }) => [
						styles.button,
						{
							backgroundColor: pressed
								? theme.actionButtonPressed
								: theme.actionButton,
						},
					]}
					onPress={() =>
						router.push(
							"/gestures/scroll-direction-propagation-horizontal/session/drawer" as any,
						)
					}
				>
					<Text
						style={[styles.buttonText, { color: theme.actionButtonText }]}
					>
						Open Drawer
					</Text>
					<Text
						style={[
							styles.buttonSubtext,
							{ color: theme.actionButtonText, opacity: 0.7 },
						]}
					>
						Slides in from left (horizontal-inverted)
					</Text>
				</Pressable>
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
		gap: 16,
	},
	infoBox: {
		borderRadius: 14,
		padding: 16,
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
	},
	infoText: {
		fontSize: 14,
		lineHeight: 20,
	},
	highlight: {
		fontWeight: "600",
	},
	instructions: {
		borderRadius: 14,
		padding: 16,
	},
	instructionTitle: {
		fontSize: 12,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 8,
	},
	instructionText: {
		fontSize: 14,
		lineHeight: 20,
	},
	actions: {
		padding: 16,
		gap: 12,
	},
	button: {
		padding: 16,
		borderRadius: 999,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	buttonSubtext: {
		fontSize: 12,
		marginTop: 4,
	},
});
