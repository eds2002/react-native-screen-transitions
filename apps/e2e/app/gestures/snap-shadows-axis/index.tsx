import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function SnapShadowsAxisIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="7. Snap Points Shadow Axis"
				subtitle="Bottom sheet claims BOTH vertical directions"
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<GestureInfo
					title="Test: Sheet shadows parent's vertical"
					structure={`gestures/snap-shadows-axis/  (vertical)
  └─ sheet (snapPoints: [0.5, 0.8], vertical)`}
					behaviors={[
						{
							direction: "down",
							owner: "Sheet",
							result: "Collapse sheet or dismiss (shadows parent)",
						},
						{
							direction: "up",
							owner: "Sheet",
							result: "Expand sheet to next snap point",
						},
						{ direction: "right", owner: null, result: "Nothing" },
						{ direction: "left", owner: null, result: "Nothing" },
					]}
					note="A snap point sheet claims BOTH directions on its axis. This sheet claims vertical AND vertical-inverted, completely shadowing the parent."
				/>

				<View
					style={[styles.conceptBox, { backgroundColor: theme.infoBox }]}
				>
					<Text style={[styles.conceptTitle, { color: theme.text }]}>
						Snap Points = Two Gestures
					</Text>
					<Text
						style={[styles.conceptText, { color: theme.textSecondary }]}
					>
						A bottom sheet (gestureDirection: vertical) with snap points
						automatically claims:{"\n"}
						{"\n"}• ↓ vertical - for collapse/dismiss{"\n"}• ↑ vertical-inverted
						- for expand
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
						onPress={() => router.push("/gestures/snap-shadows-axis/sheet")}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Open Bottom Sheet
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
