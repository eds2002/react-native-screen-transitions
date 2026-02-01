import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function ScrollDirectionPropagationIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Scroll Direction Propagation"
				subtitle="ScrollView coordinates with two owners on same axis"
			/>

			<GestureInfo
				title="Test: Per-direction ScrollView ownership"
				structure={`scroll-direction-propagation/  (vertical)
  ├─ session                        (inherits vertical)
  └─ settings/                      (vertical-inverted)
       └─ index with ScrollView`}
				behaviors={[
					{
						direction: "down",
						owner: "Outer stack",
						result: "Dismisses outer stack (at scrollY = 0)",
					},
					{
						direction: "up",
						owner: "Settings stack",
						result: "Dismisses settings (at scrollY = maxY)",
					},
				]}
				note="The ScrollView must coordinate with TWO gesture owners on the same axis. At the top boundary it yields to the outer stack (vertical). At the bottom boundary it yields to settings (vertical-inverted)."
			/>

			<View style={styles.actions}>
				<Pressable
					style={styles.button}
					onPress={() =>
						router.push("/gestures/scroll-direction-propagation/session" as any)
					}
				>
					<Text style={styles.buttonText}>Open Session</Text>
					<Text style={styles.buttonSubtext}>
						Then navigate to settings from there
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
