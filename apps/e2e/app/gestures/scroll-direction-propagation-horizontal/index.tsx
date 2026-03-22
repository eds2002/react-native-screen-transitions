import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function ScrollDirectionPropagationHorizontalIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Scroll Direction Propagation (Horizontal)"
				subtitle="ScrollView coordinates with two owners on same axis"
			/>

			<GestureInfo
				title="Test: Per-direction Horizontal ScrollView ownership"
				structure={`scroll-direction-propagation-horizontal/  (horizontal)
  ├─ session                                   (inherits horizontal)
  └─ drawer/                                   (horizontal-inverted)
       └─ index with horizontal ScrollView`}
				behaviors={[
					{
						direction: "right",
						owner: "Outer stack",
						result: "Dismisses outer stack (at scrollX = 0)",
					},
					{
						direction: "left",
						owner: "Drawer stack",
						result: "Dismisses drawer (at scrollX = maxX)",
					},
				]}
				note="The horizontal ScrollView must coordinate with TWO gesture owners on the same axis. At the left boundary it yields to the outer stack (horizontal). At the right boundary it yields to the drawer stack (horizontal-inverted)."
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
					onPress={() =>
						router.push(
							"/gestures/scroll-direction-propagation-horizontal/session" as any,
						)
					}
				>
					<Text
						style={[styles.buttonText, { color: theme.actionButtonText }]}
					>
						Open Session
					</Text>
					<Text
						style={[
							styles.buttonSubtext,
							{ color: theme.actionButtonText, opacity: 0.7 },
						]}
					>
						Then open the drawer from there
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
