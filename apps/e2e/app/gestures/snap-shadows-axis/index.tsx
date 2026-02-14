import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function SnapShadowsAxisIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
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

				<View style={styles.conceptBox}>
					<Text style={styles.conceptTitle}>Snap Points = Two Gestures</Text>
					<Text style={styles.conceptText}>
						A bottom sheet (gestureDirection: vertical) with snap points
						automatically claims:{"\n"}
						{"\n"}• ↓ vertical - for collapse/dismiss{"\n"}• ↑ vertical-inverted
						- for expand
					</Text>
				</View>

				<View style={styles.actions}>
					<Pressable
						style={styles.button}
						onPress={() => router.push("/gestures/snap-shadows-axis/sheet")}
					>
						<Text style={styles.buttonText}>Open Bottom Sheet</Text>
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
		backgroundColor: "rgba(255, 74, 158, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 74, 158, 0.3)",
	},
	conceptTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#ff4a9e",
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
		backgroundColor: "#ff4a9e",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	buttonSubtext: {
		color: "rgba(255, 255, 255, 0.7)",
		fontSize: 12,
		marginTop: 4,
	},
});
