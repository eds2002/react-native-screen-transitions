import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function InvertedGestureIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="5. Inverted Gesture"
				subtitle="Swipe UP to dismiss instead of down"
			/>

			<GestureInfo
				title="Test: vertical-inverted direction"
				structure={`gestures/inverted-gesture/  (vertical-inverted)
  └─ leaf                      (inherits)`}
				behaviors={[
					{
						direction: "up",
						owner: "This stack",
						result: "Dismisses stack",
					},
					{
						direction: "down",
						owner: null,
						result: "Nothing (different direction)",
					},
					{ direction: "right", owner: null, result: "Nothing" },
					{ direction: "left", owner: null, result: "Nothing" },
				]}
				note="vertical ≠ vertical-inverted. They are independent directions. A screen claiming vertical doesn't shadow vertical-inverted."
			/>

			<View style={styles.actions}>
				<Pressable
					style={styles.button}
					onPress={() => router.push("/gestures/inverted-gesture/leaf")}
				>
					<Text style={styles.buttonText}>Open Leaf Screen</Text>
					<Text style={styles.buttonSubtext}>Swipe UP to dismiss</Text>
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
