import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function TwoAxesIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="2. Two Axes, No Conflict"
				subtitle="Vertical parent + horizontal child"
			/>

			<GestureInfo
				title="Test: Independent axes coexist"
				structure={`gestures/two-axes/  (this stack)
  └─ leaf             (horizontal)`}
				behaviors={[
					{
						direction: "down",
						owner: "This stack",
						result: "Dismisses entire stack",
					},
					{ direction: "right", owner: "Leaf", result: "Dismisses leaf only" },
					{ direction: "up", owner: null, result: "Nothing" },
					{ direction: "left", owner: null, result: "Nothing" },
				]}
				note="Vertical and horizontal axes never interfere with each other. Both gestures work independently."
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
					onPress={() => router.push("/gestures/two-axes/leaf")}
				>
					<Text style={[styles.buttonText, { color: theme.actionButtonText }]}>
						Open Leaf Screen
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
});
