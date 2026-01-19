import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function DeepNestingIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="4. Deep Nesting (3 Levels)"
				subtitle="Multiple nested stacks with gesture resolution"
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<GestureInfo
					title="Test: 3-level nesting with shadowing"
					structure={`gestures/deep-nesting/     (vertical)   ← Level 1
  └─ deeper/                  (horizontal)  ← Level 2
       └─ leaf                (vertical)    ← Level 3 (shadows L1)`}
					behaviors={[
						{
							direction: "down",
							owner: "This stack (L1)",
							result: "Dismisses entire deep-nesting stack",
						},
						{
							direction: "right",
							owner: "Deeper (L2)",
							result: "Will be available inside deeper/",
						},
					]}
					note="Navigate to deeper/ to see the full 3-level inheritance in action."
				/>

				<View style={styles.actions}>
					<Pressable
						style={styles.button}
						onPress={() => router.push("/gestures/deep-nesting/deeper")}
					>
						<Text style={styles.buttonText}>Go Deeper (Level 2)</Text>
						<Text style={styles.buttonSubtext}>
							Horizontal stack with leaf screen
						</Text>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
	},
	scrollContent: {
		paddingBottom: 40,
	},
	actions: {
		padding: 16,
		gap: 12,
	},
	button: {
		backgroundColor: "#4a9eff",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	buttonSubtext: {
		color: "rgba(255, 255, 255, 0.7)",
		fontSize: 12,
		marginTop: 4,
	},
});
