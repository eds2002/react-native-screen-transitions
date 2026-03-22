import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function ScrollDirectionPropagationIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Scroll Direction Propagation"
				subtitle="ScrollView coordinates with two owners on same axis"
			/>

			<GestureInfo
				title="Test: Per-direction ScrollView ownership"
				structure={`scroll-direction-propagation/  (vertical)
  ├─ session                        (inherits vertical)
  └─ settings/                      (vertical-inverted)
       └─ index with ScrollView`}
				behaviors={[
					{
						direction: "down",
						owner: "Outer stack",
						result: "Dismisses outer stack (at scrollY = 0)",
					},
					{
						direction: "up",
						owner: "Settings stack",
						result: "Dismisses settings (at scrollY = maxY)",
					},
				]}
				note="The ScrollView must coordinate with TWO gesture owners on the same axis. At the top boundary it yields to the outer stack (vertical). At the bottom boundary it yields to settings (vertical-inverted)."
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
						router.push("/gestures/scroll-direction-propagation/session" as any)
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
						Then navigate to settings from there
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
