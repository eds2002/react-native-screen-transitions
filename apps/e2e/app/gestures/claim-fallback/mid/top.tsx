import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function ClaimFallbackTopScreen() {
	return (
		<SafeAreaView
			style={styles.container}
			edges={["top"]}
			testID="claim-fallback-l3-top"
		>
			<ScreenHeader
				title="L3: Top (vertical)"
				subtitle="Shadows L2 while mounted"
			/>

			<GestureInfo
				title="Manual steps"
				structure={`claim-fallback/ (L1 vertical)
  └─ mid/       (L2 vertical)
       └─ top   (L3 vertical, YOU ARE HERE)`}
				behaviors={[
					{
						direction: "down",
						owner: "L3",
						result: "Dismisses only this screen (back to L2 index)",
					},
					{ direction: "up", owner: null, result: "Nothing" },
					{ direction: "right", owner: null, result: "Nothing" },
					{ direction: "left", owner: null, result: "Nothing" },
				]}
				note="After dismissing this screen, swipe down on L2. Expected: L2 dismisses first, then L1 on next swipe."
			/>

			<View style={styles.callout}>
				<Text style={styles.calloutTitle}>Why this catches the bug</Text>
				<Text style={styles.calloutText}>
					If claim cleanup clears to null without restoring nearest fallback, L2
					may lose priority after L3 unmount and downward swipe can jump to L1.
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#25344d",
	},
	callout: {
		margin: 16,
		backgroundColor: "rgba(255, 193, 7, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 193, 7, 0.35)",
	},
	calloutTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#ffc107",
		marginBottom: 8,
	},
	calloutText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.8)",
		lineHeight: 20,
	},
});
