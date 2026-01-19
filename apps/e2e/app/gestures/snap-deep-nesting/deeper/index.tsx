import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function DeeperIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="L2: Deeper (horizontal)"
				subtitle="Inside snap-deep-nesting (vertical)"
			/>

			<GestureInfo
				title="Current position in hierarchy"
				structure={`gestures/snap-deep-nesting/  (vertical)    ← L1
  └─ deeper/                   (horizontal)   ← YOU ARE HERE
       └─ sheet (snapPoints, vertical)        ← L3`}
				behaviors={[
					{
						direction: "down",
						owner: "snap-deep-nesting (L1)",
						result: "Dismisses L1 stack",
					},
					{
						direction: "right",
						owner: "deeper (L2)",
						result: "Dismisses this stack",
					},
					{ direction: "up", owner: null, result: "Nothing" },
					{ direction: "left", owner: null, result: "Nothing" },
				]}
				note="At this level, vertical and horizontal work as expected. Open the sheet to see snap points in action."
			/>

			<View style={styles.actions}>
				<Pressable
					style={styles.button}
					onPress={() =>
						router.push("/gestures/snap-deep-nesting/deeper/sheet")
					}
				>
					<Text style={styles.buttonText}>Open Sheet (L3)</Text>
					<Text style={styles.buttonSubtext}>
						Snap points: [0.5, 0.8] - vertical
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#3a1b4e",
	},
	actions: {
		padding: 16,
		gap: 12,
	},
	button: {
		backgroundColor: "#ff9eff",
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
