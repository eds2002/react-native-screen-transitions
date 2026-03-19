import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function ScrollDirectionPropagationHorizontalIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Scroll Direction Propagation (Horizontal)"
				subtitle="ScrollView coordinates with two owners on same axis"
			/>

			<GestureInfo
				title="Test: Per-direction Horizontal ScrollView ownership"
				structure={`scroll-direction-propagation-horizontal/  (horizontal)
  ├─ session                                   (inherits horizontal)
  └─ drawer/                                   (horizontal-inverted)
       └─ index with horizontal ScrollView`}
				behaviors={[
					{
						direction: "right",
						owner: "Outer stack",
						result: "Dismisses outer stack (at scrollX = 0)",
					},
					{
						direction: "left",
						owner: "Drawer stack",
						result: "Dismisses drawer (at scrollX = maxX)",
					},
				]}
				note="The horizontal ScrollView must coordinate with TWO gesture owners on the same axis. At the left boundary it yields to the outer stack (horizontal). At the right boundary it yields to the drawer stack (horizontal-inverted)."
			/>

			<View style={styles.actions}>
				<Pressable
					style={styles.button}
					onPress={() =>
						router.push(
							"/gestures/scroll-direction-propagation-horizontal/session" as any,
						)
					}
				>
					<Text style={styles.buttonText}>Open Session</Text>
					<Text style={styles.buttonSubtext}>
						Then open the drawer from there
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#142033",
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
		color: "rgba(255, 255, 255, 0.6)",
		fontSize: 12,
		marginTop: 4,
	},
});
