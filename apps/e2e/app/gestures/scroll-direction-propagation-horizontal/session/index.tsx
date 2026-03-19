import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

/**
 * Session screen — inherits horizontal gesture from the parent route.
 *
 * Test:
 * - Swipe → should dismiss (horizontal owner)
 * - Navigate to drawer to test horizontal ScrollView multi-owner coordination
 */
export default function HorizontalSessionScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Horizontal Session"
				subtitle="Inherits horizontal from parent route"
			/>

			<View style={styles.content}>
				<View style={styles.infoBox}>
					<Text style={styles.infoTitle}>Current Gesture Ownership</Text>
					<Text style={styles.infoText}>
						This screen does not configure its own gesture. It inherits{" "}
						<Text style={styles.highlight}>horizontal</Text> from the parent
						route.
						{"\n\n"}
						Swipe → to dismiss back to the entry screen.
					</Text>
				</View>

				<View style={styles.instructions}>
					<Text style={styles.instructionTitle}>Next step</Text>
					<Text style={styles.instructionText}>
						Open the drawer to test horizontal ScrollView coordination with two
						gesture owners on the same axis.
					</Text>
				</View>
			</View>

			<View style={styles.actions}>
				<Pressable
					style={styles.button}
					onPress={() =>
						router.push(
							"/gestures/scroll-direction-propagation-horizontal/session/drawer" as any,
						)
					}
				>
					<Text style={styles.buttonText}>Open Drawer</Text>
					<Text style={styles.buttonSubtext}>
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
		backgroundColor: "#153047",
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
