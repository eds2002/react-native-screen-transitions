import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function ClaimFallbackIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
			testID="claim-fallback-l1-index"
		>
			<ScreenHeader
				title="Claim Fallback Chain"
				subtitle="L1 vertical owner (entry screen)"
			/>

			<GestureInfo
				title="Expected ownership chain"
				structure={`claim-fallback/       (vertical)  <- L1 (YOU ARE HERE)
  └─ mid/             (vertical)  <- L2
       └─ top         (vertical)  <- L3`}
				behaviors={[
					{
						direction: "down",
						owner: "L1",
						result: "Dismiss this route (back to gestures index)",
					},
					{ direction: "up", owner: null, result: "Nothing" },
					{ direction: "right", owner: null, result: "Nothing" },
					{ direction: "left", owner: null, result: "Nothing" },
				]}
				note="Open L2 then L3. After dismissing L3, the next down-swipe should dismiss L2 (nearest fallback), not jump past it."
			/>

			<View style={styles.actions}>
				<Pressable
					testID="claim-fallback-open-mid"
					style={({ pressed }) => [
						styles.button,
						{
							backgroundColor: pressed
								? theme.actionButtonPressed
								: theme.actionButton,
						},
					]}
					onPress={() => router.push("/gestures/claim-fallback/mid" as never)}
				>
					<Text
						style={[styles.buttonText, { color: theme.actionButtonText }]}
					>
						Open L2 (Mid)
					</Text>
					<Text
						style={[
							styles.buttonSubtext,
							{ color: theme.actionButtonText, opacity: 0.7 },
						]}
					>
						Then open L3 and test fallback
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	actions: {
		padding: 16,
	},
	button: {
		padding: 16,
		borderRadius: 999,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "700",
	},
	buttonSubtext: {
		fontSize: 12,
		marginTop: 4,
	},
});
