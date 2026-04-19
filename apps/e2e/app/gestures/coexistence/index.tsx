import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function CoexistenceIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="6. Same Axis, Different Directions"
				subtitle="vertical-inverted + vertical coexist"
			/>

			<GestureInfo
				title="Test: Both ↑ and ↓ work independently"
				structure={`gestures/coexistence/  (vertical-inverted)
  └─ leaf               (vertical)`}
				behaviors={[
					{
						direction: "up",
						owner: "This stack",
						result: "Dismisses entire stack",
					},
					{
						direction: "down",
						owner: "Leaf",
						result: "Dismisses only leaf (back here)",
					},
					{ direction: "right", owner: null, result: "Nothing" },
					{ direction: "left", owner: null, result: "Nothing" },
				]}
				note="No conflict! vertical and vertical-inverted are DIFFERENT directions. Child claims ↓, parent claims ↑. Both work."
			/>

			<View style={styles.actions}>
				<Pressable
					style={({ pressed }) => [
						styles.button,
						{
							backgroundColor: pressed
								? theme.actionButtonPressed
								: theme.actionButton,
						},
					]}
					onPress={() => router.push("/gestures/coexistence/leaf")}
				>
					<Text style={[styles.buttonText, { color: theme.actionButtonText }]}>
						Open Leaf Screen
					</Text>
					<Text
						style={[
							styles.buttonSubtext,
							{ color: theme.actionButtonText, opacity: 0.7 },
						]}
					>
						↓ dismisses leaf, ↑ dismisses stack
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
		gap: 12,
	},
	button: {
		padding: 16,
		borderRadius: 999,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	buttonSubtext: {
		fontSize: 12,
		marginTop: 4,
	},
});
