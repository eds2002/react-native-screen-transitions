import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function SnapDifferentAxisIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
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

				<View style={styles.conceptBox}>
					<Text style={styles.conceptTitle}>Axis Independence</Text>
					<Text style={styles.conceptText}>
						A horizontal drawer (with snap points) claims:{"\n"}
						{"\n"}• → horizontal - collapse/dismiss{"\n"}• ← horizontal-inverted
						- expand{"\n"}
						{"\n"}Vertical axis is untouched, so inheritance works normally!
					</Text>
				</View>

				<View style={styles.actions}>
					<Pressable
						style={styles.button}
						onPress={() => router.push("/gestures/snap-different-axis/drawer")}
					>
						<Text style={styles.buttonText}>Open Right Drawer</Text>
						<Text style={styles.buttonSubtext}>
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
		backgroundColor: "#1a1a2e",
	},
	scrollContent: {
		paddingBottom: 40,
	},
	conceptBox: {
		margin: 16,
		backgroundColor: "rgba(74, 255, 255, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(74, 255, 255, 0.3)",
	},
	conceptTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#4affff",
		marginBottom: 8,
	},
	conceptText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.8)",
		lineHeight: 20,
	},
	actions: {
		padding: 16,
		gap: 12,
	},
	button: {
		backgroundColor: "#4affff",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#000",
		fontSize: 16,
		fontWeight: "600",
	},
	buttonSubtext: {
		color: "rgba(0, 0, 0, 0.6)",
		fontSize: 12,
		marginTop: 4,
	},
});
