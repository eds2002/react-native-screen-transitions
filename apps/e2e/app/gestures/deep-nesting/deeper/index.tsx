import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function DeeperIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Level 2: Deeper (horizontal)"
				subtitle="Nested inside deep-nesting (vertical)"
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<GestureInfo
					title="Current position in hierarchy"
					structure={`gestures/deep-nesting/     (vertical)   ← L1 (ancestor)
  └─ deeper/                  (horizontal)  ← YOU ARE HERE
       └─ leaf                (vertical)    ← L3`}
					behaviors={[
						{
							direction: "down",
							owner: "deep-nesting (L1)",
							result: "Dismisses L1 stack (back to gestures index)",
						},
						{
							direction: "right",
							owner: "deeper (L2)",
							result: "Dismisses this stack (back to deep-nesting index)",
						},
						{ direction: "up", owner: null, result: "Nothing" },
						{ direction: "left", owner: null, result: "Nothing" },
					]}
					note="From here, ↓ goes to L1 ancestor (vertical), → goes to this stack (horizontal)."
				/>

				<View style={styles.actions}>
					<Pressable
						style={styles.button}
						onPress={() => router.push("/gestures/deep-nesting/deeper/leaf")}
					>
						<Text style={styles.buttonText}>Open Leaf (Level 3)</Text>
						<Text style={styles.buttonSubtext}>
							Vertical gesture (shadows L1)
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
		backgroundColor: "#1b3a4e",
	},
	scrollContent: {
		paddingBottom: 40,
	},
	actions: {
		padding: 16,
		gap: 12,
	},
	button: {
		backgroundColor: "#4aff9e",
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
