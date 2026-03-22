import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function ClaimFallbackTopScreen() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
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

			<View
				style={[styles.callout, { backgroundColor: theme.noteBox }]}
			>
				<Text style={[styles.calloutTitle, { color: theme.noteText }]}>
					Why this catches the bug
				</Text>
				<Text
					style={[styles.calloutText, { color: theme.textSecondary }]}
				>
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
	},
	callout: {
		margin: 16,
		borderRadius: 14,
		padding: 16,
	},
	calloutTitle: {
		fontSize: 14,
		fontWeight: "700",
		marginBottom: 8,
	},
	calloutText: {
		fontSize: 13,
		lineHeight: 20,
	},
});
