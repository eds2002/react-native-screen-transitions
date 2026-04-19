import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function SimpleInheritanceIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="1. Simple Inheritance"
				subtitle="Child inherits parent's gesture"
			/>

			<GestureInfo
				title="Test: Leaf screen inherits vertical"
				structure={`gestures/simple-inheritance/  (vertical)
  └─ leaf                        (none → inherits)`}
				behaviors={[
					{ direction: "down", owner: "This stack", result: "Dismisses stack" },
					{ direction: "up", owner: null, result: "Nothing" },
					{ direction: "right", owner: null, result: "Nothing" },
					{ direction: "left", owner: null, result: "Nothing" },
				]}
				note="The leaf has no gesture config, so it inherits the vertical gesture from this layout."
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
					onPress={() => router.push("/gestures/simple-inheritance/leaf")}
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
