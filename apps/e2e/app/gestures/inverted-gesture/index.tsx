import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function InvertedGestureIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="5. Inverted Gesture"
				subtitle="Swipe UP to dismiss instead of down"
			/>

			<GestureInfo
				title="Test: vertical-inverted direction"
				structure={`gestures/inverted-gesture/  (vertical-inverted)
  └─ leaf                      (inherits)`}
				behaviors={[
					{
						direction: "up",
						owner: "This stack",
						result: "Dismisses stack",
					},
					{
						direction: "down",
						owner: null,
						result: "Nothing (different direction)",
					},
					{ direction: "right", owner: null, result: "Nothing" },
					{ direction: "left", owner: null, result: "Nothing" },
				]}
				note="vertical ≠ vertical-inverted. They are independent directions. A screen claiming vertical doesn't shadow vertical-inverted."
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
					onPress={() => router.push("/gestures/inverted-gesture/leaf")}
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
						Swipe UP to dismiss
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
