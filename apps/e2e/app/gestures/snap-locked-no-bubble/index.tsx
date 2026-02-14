import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function SnapLockedNoBubbleIndex() {
	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
			testID="snap-locked-no-bubble-index"
		>
			<ScreenHeader
				title="Locked Snap No Bubble"
				subtitle="Child locked + no-dismiss should not propagate to parent"
			/>

			<GestureInfo
				title="Expected behavior"
				structure={`snap-locked-no-bubble/  (parent vertical)
  └─ sheet                (snap + locked + no-dismiss)`}
				behaviors={[
					{
						direction: "down",
						owner: "Sheet",
						result: "No movement and NO parent dismissal",
					},
					{
						direction: "up",
						owner: "Sheet",
						result: "No movement (gestureSnapLocked)",
					},
					{ direction: "right", owner: null, result: "Nothing" },
					{ direction: "left", owner: null, result: "Nothing" },
				]}
				note="If axis ownership incorrectly bubbles while locked, a down-swipe on sheet may dismiss parent route."
			/>

			<View style={styles.actions}>
				<Pressable
					testID="snap-locked-no-bubble-open-sheet"
					style={styles.button}
					onPress={() =>
						router.push("/gestures/snap-locked-no-bubble/sheet" as never)
					}
				>
					<Text style={styles.buttonText}>Open Locked Sheet</Text>
					<Text style={styles.buttonSubtext}>Try repeated vertical swipes</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#221a30",
	},
	actions: {
		padding: 16,
	},
	button: {
		backgroundColor: "#b38cff",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#1f1433",
		fontSize: 16,
		fontWeight: "700",
	},
	buttonSubtext: {
		color: "rgba(31, 20, 51, 0.7)",
		fontSize: 12,
		marginTop: 4,
	},
});
