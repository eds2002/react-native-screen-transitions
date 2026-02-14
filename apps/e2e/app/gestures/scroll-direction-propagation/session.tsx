import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

/**
 * Session screen — inherits vertical gesture from parent layout.
 *
 * Test:
 * - Swipe ↓ should dismiss (inherited from outer stack)
 * - Navigate to settings to test ScrollView multi-owner coordination
 */
export default function SessionScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Session"
				subtitle="Inherits vertical from outer stack"
			/>

			<View style={styles.content}>
				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>Current Gesture Ownership</Text>
					<Text style={styles.infoText}>
						This screen has no gesture config of its own. It inherits{" "}
						<Text style={styles.highlight}>vertical</Text> from the outer stack.
						{"\n\n"}
						Swipe ↓ to dismiss back to the entry screen.
					</Text>
				</View>

				<View style={styles.instructions}>
					<Text style={styles.instructionTitle}>Next step</Text>
					<Text style={styles.instructionText}>
						Open the settings screen to test ScrollView coordination with two
						gesture owners on the same vertical axis.
					</Text>
				</View>
			</View>

			<View style={styles.actions}>
				<Pressable
					style={styles.button}
					onPress={() =>
						router.push(
							"/gestures/scroll-direction-propagation/settings" as any,
						)
					}
				>
					<Text style={styles.buttonText}>Open Settings</Text>
					<Text style={styles.buttonSubtext}>
						Slides in from top (vertical-inverted)
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a2e4e",
	},
	content: {
		flex: 1,
		padding: 16,
		gap: 16,
	},
	infoBox: {
		backgroundColor: "rgba(74, 158, 255, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(74, 158, 255, 0.3)",
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#4a9eff",
		marginBottom: 8,
	},
	infoText: {
		fontSize: 14,
		color: "rgba(255, 255, 255, 0.8)",
		lineHeight: 20,
	},
	highlight: {
		color: "#4a9eff",
		fontWeight: "600",
	},
	instructions: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 12,
		padding: 16,
	},
	instructionTitle: {
		fontSize: 12,
		fontWeight: "600",
		color: "#888",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 8,
	},
	instructionText: {
		fontSize: 14,
		color: "rgba(255, 255, 255, 0.7)",
		lineHeight: 20,
	},
	actions: {
		padding: 16,
		gap: 12,
	},
	button: {
		backgroundColor: "#ff9e4a",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#000",
		fontSize: 16,
		fontWeight: "600",
	},
	buttonSubtext: {
		color: "rgba(0, 0, 0, 0.6)",
		fontSize: 12,
		marginTop: 4,
	},
});
