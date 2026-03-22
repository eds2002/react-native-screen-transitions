import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function DeeperIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Level 2: Deeper (horizontal)"
				subtitle="Nested inside deep-nesting (vertical)"
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<GestureInfo
					title="Current position in hierarchy"
					structure={`gestures/deep-nesting/     (vertical)   ← L1 (ancestor)
  └─ deeper/                  (horizontal)  ← YOU ARE HERE
       └─ leaf                (vertical)    ← L3`}
					behaviors={[
						{
							direction: "down",
							owner: "deep-nesting (L1)",
							result: "Dismisses L1 stack (back to gestures index)",
						},
						{
							direction: "right",
							owner: "deeper (L2)",
							result: "Dismisses this stack (back to deep-nesting index)",
						},
						{ direction: "up", owner: null, result: "Nothing" },
						{ direction: "left", owner: null, result: "Nothing" },
					]}
					note="From here, ↓ goes to L1 ancestor (vertical), → goes to this stack (horizontal)."
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
						onPress={() => router.push("/gestures/deep-nesting/deeper/leaf")}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Open Leaf (Level 3)
						</Text>
						<Text
							style={[
								styles.buttonSubtext,
								{ color: theme.actionButtonText, opacity: 0.7 },
							]}
						>
							Vertical gesture (shadows L1)
						</Text>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 40,
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
