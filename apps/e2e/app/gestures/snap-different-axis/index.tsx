import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function SnapDifferentAxisIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="8. Snap Points + Different Axis"
				subtitle="Horizontal drawer inherits vertical from parent"
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<GestureInfo
					title="Test: Drawer owns horizontal, inherits vertical"
					structure={`gestures/snap-different-axis/  (vertical)
  └─ drawer (snapPoints: [0.5, 0.8], horizontal)`}
					behaviors={[
						{
							direction: "right",
							owner: "Drawer",
							result: "Collapse/dismiss drawer",
						},
						{
							direction: "left",
							owner: "Drawer",
							result: "Expand drawer",
						},
						{
							direction: "down",
							owner: "This stack",
							result: "Dismisses entire stack (inherited)",
						},
						{ direction: "up", owner: null, result: "Nothing" },
					]}
					note="The drawer owns horizontal axis (both directions). Vertical axis is free, so it inherits from the parent stack."
				/>

				<View
					style={[styles.conceptBox, { backgroundColor: theme.infoBox }]}
				>
					<Text style={[styles.conceptTitle, { color: theme.text }]}>
						Axis Independence
					</Text>
					<Text
						style={[styles.conceptText, { color: theme.textSecondary }]}
					>
						A horizontal drawer (with snap points) claims:{"\n"}
						{"\n"}• → horizontal - collapse/dismiss{"\n"}• ← horizontal-inverted
						- expand{"\n"}
						{"\n"}Vertical axis is untouched, so inheritance works normally!
					</Text>
				</View>

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
						onPress={() => router.push("/gestures/snap-different-axis/drawer")}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Open Right Drawer
						</Text>
						<Text
							style={[
								styles.buttonSubtext,
								{ color: theme.actionButtonText, opacity: 0.7 },
							]}
						>
							snapPoints: [0.5, 0.8] - starts at 0.5
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
	conceptBox: {
		margin: 16,
		borderRadius: 14,
		padding: 16,
	},
	conceptTitle: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
	},
	conceptText: {
		fontSize: 13,
		lineHeight: 20,
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
