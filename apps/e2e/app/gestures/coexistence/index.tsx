import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function CoexistenceIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="6. Same Axis, Different Directions"
				subtitle="vertical-inverted + vertical coexist"
			/>

			<GestureInfo
				title="Test: Both ↑ and ↓ work independently"
				structure={`gestures/coexistence/  (vertical-inverted)
  └─ leaf               (vertical)`}
				behaviors={[
					{
						direction: "up",
						owner: "This stack",
						result: "Dismisses entire stack",
					},
					{
						direction: "down",
						owner: "Leaf",
						result: "Dismisses only leaf (back here)",
					},
					{ direction: "right", owner: null, result: "Nothing" },
					{ direction: "left", owner: null, result: "Nothing" },
				]}
				note="No conflict! vertical and vertical-inverted are DIFFERENT directions. Child claims ↓, parent claims ↑. Both work."
			/>

			<View style={styles.actions}>
				<Pressable
					style={styles.button}
					onPress={() => router.push("/gestures/coexistence/leaf")}
				>
					<Text style={styles.buttonText}>Open Leaf Screen</Text>
					<Text style={styles.buttonSubtext}>
						↓ dismisses leaf, ↑ dismisses stack
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
	},
	actions: {
		padding: 16,
		gap: 12,
	},
	button: {
		backgroundColor: "#9eff4a",
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
