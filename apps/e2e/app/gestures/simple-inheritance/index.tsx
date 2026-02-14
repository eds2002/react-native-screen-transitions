import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function SimpleInheritanceIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="1. Simple Inheritance"
				subtitle="Child inherits parent's gesture"
			/>

			<GestureInfo
				title="Test: Leaf screen inherits vertical"
				structure={`gestures/simple-inheritance/  (vertical)
  └─ leaf                        (none → inherits)`}
				behaviors={[
					{ direction: "down", owner: "This stack", result: "Dismisses stack" },
					{ direction: "up", owner: null, result: "Nothing" },
					{ direction: "right", owner: null, result: "Nothing" },
					{ direction: "left", owner: null, result: "Nothing" },
				]}
				note="The leaf has no gesture config, so it inherits the vertical gesture from this layout."
			/>

			<View style={styles.actions}>
				<Pressable
					style={styles.button}
					onPress={() => router.push("/gestures/simple-inheritance/leaf")}
				>
					<Text style={styles.buttonText}>Open Leaf Screen</Text>
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
});
