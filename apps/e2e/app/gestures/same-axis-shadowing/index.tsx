import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function SameAxisShadowingIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="3. Same Axis Shadowing"
				subtitle="Child shadows parent's vertical"
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<GestureInfo
					title="Compare: Inheriting vs Shadowing"
					structure={`gestures/same-axis-shadowing/  (vertical)
  ├─ leaf-a  (none → inherits vertical)
  └─ leaf-b  (vertical → SHADOWS parent)`}
					behaviors={[
						{
							direction: "down",
							owner: "Leaf-A / Leaf-B",
							result: "See comparison below",
						},
					]}
					note="When a child claims the SAME direction as its parent, the child shadows (blocks) the parent. The gesture only affects the child's screen."
				/>

				<View style={styles.comparison}>
					<View style={styles.comparisonItem}>
						<Text style={styles.comparisonTitle}>Leaf A (inherits)</Text>
						<Text style={styles.comparisonText}>
							No gesture config → inherits from parent. Swipe ↓ dismisses the
							ENTIRE stack.
						</Text>
					</View>
					<View style={styles.comparisonItem}>
						<Text style={styles.comparisonTitle}>Leaf B (shadows)</Text>
						<Text style={styles.comparisonText}>
							Has vertical gesture → shadows parent. Swipe ↓ dismisses ONLY
							leaf-b, returning to this index.
						</Text>
					</View>
				</View>

				<View style={styles.actions}>
					<Pressable
						style={styles.button}
						onPress={() => router.push("/gestures/same-axis-shadowing/leaf-a")}
					>
						<Text style={styles.buttonText}>Open Leaf A (inherits)</Text>
						<Text style={styles.buttonSubtext}>↓ dismisses entire stack</Text>
					</Pressable>
					<Pressable
						style={[styles.button, styles.buttonAlt]}
						onPress={() => router.push("/gestures/same-axis-shadowing/leaf-b")}
					>
						<Text style={styles.buttonText}>Open Leaf B (shadows)</Text>
						<Text style={styles.buttonSubtext}>↓ dismisses only leaf-b</Text>
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
	comparison: {
		padding: 16,
		gap: 12,
	},
	comparisonItem: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
	},
	comparisonTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#4a9eff",
		marginBottom: 8,
	},
	comparisonText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.7)",
		lineHeight: 20,
	},
	actions: {
		padding: 16,
		gap: 12,
	},
	button: {
		backgroundColor: "#4a9eff",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonAlt: {
		backgroundColor: "#9e4aff",
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
