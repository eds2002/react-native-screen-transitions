import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function ScrollBoundaryIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="ScrollView Boundary"
				subtitle="Dismiss only works at scroll top"
			/>

			<GestureInfo
				title="Test: Vertical ScrollView + vertical dismiss"
				structure={`gestures/scroll-boundary/  (vertical)
  └─ screen with Transition.ScrollView`}
				behaviors={[
					{
						direction: "down",
						owner: "Screen",
						result: "Dismisses IF scrollY = 0",
					},
				]}
				note="The ScrollView must be at its boundary (scrollY = 0 for vertical) before yielding to the gesture. If mid-scroll, the ScrollView handles the gesture instead."
			/>

			<View style={styles.ruleBox}>
				<Text style={styles.ruleTitle}>The Golden Rule</Text>
				<Text style={styles.ruleText}>
					A ScrollView must be at its boundary before it yields control to
					gestures.
				</Text>
			</View>

			<View style={styles.actions}>
				<Pressable
					style={styles.button}
					onPress={() => router.push("/gestures/scroll-boundary/screen")}
				>
					<Text style={styles.buttonText}>Open Screen with ScrollView</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
	},
	ruleBox: {
		margin: 16,
		backgroundColor: "rgba(255, 193, 7, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 193, 7, 0.3)",
	},
	ruleTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#ffc107",
		marginBottom: 8,
	},
	ruleText: {
		fontSize: 14,
		color: "rgba(255, 255, 255, 0.8)",
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
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});
