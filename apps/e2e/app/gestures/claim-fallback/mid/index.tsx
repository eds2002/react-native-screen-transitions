import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function ClaimFallbackMidIndex() {
	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
			testID="claim-fallback-l2-index"
		>
			<ScreenHeader
				title="L2: Mid (vertical)"
				subtitle="Should take over after L3 unmount"
			/>

			<GestureInfo
				title="Expected on this screen"
				structure={`claim-fallback/       (vertical) <- L1
  └─ mid/             (vertical) <- L2 (YOU ARE HERE)
       └─ top         (vertical) <- L3`}
				behaviors={[
					{
						direction: "down",
						owner: "L2",
						result: "Dismisses L2 (back to L1 index)",
					},
					{ direction: "up", owner: null, result: "Nothing" },
					{ direction: "right", owner: null, result: "Nothing" },
					{ direction: "left", owner: null, result: "Nothing" },
				]}
				note="Open L3, dismiss it, then swipe down here. If claim fallback breaks, this may skip L2 and dismiss L1 instead."
			/>

			<View style={styles.actions}>
				<Pressable
					testID="claim-fallback-open-top"
					style={styles.button}
					onPress={() =>
						router.push("/gestures/claim-fallback/mid/top" as never)
					}
				>
					<Text style={styles.buttonText}>Open L3 (Top)</Text>
					<Text style={styles.buttonSubtext}>
						Dismiss L3, then test this screen
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1e2a3f",
	},
	actions: {
		padding: 16,
	},
	button: {
		backgroundColor: "#4aff9e",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#0f1a2b",
		fontSize: 16,
		fontWeight: "700",
	},
	buttonSubtext: {
		color: "rgba(15, 26, 43, 0.7)",
		fontSize: 12,
		marginTop: 4,
	},
});
