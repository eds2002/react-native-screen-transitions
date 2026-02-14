import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function AppleMapsIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Apple Maps Style"
				subtitle="expandViaScrollView: true"
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<GestureInfo
					title="Test: Expand AND collapse via ScrollView"
					structure={`sheet (snapPoints: [0.4, 0.7, 1.0])
  expandViaScrollView: true
  └─ Transition.ScrollView`}
					behaviors={[
						{
							direction: "down",
							owner: "Sheet",
							result: "Collapse (at boundary) or scroll",
						},
						{
							direction: "up",
							owner: "Sheet",
							result: "Expand (at boundary) or scroll",
						},
					]}
					note="When at scroll top (scrollY = 0), BOTH ↓ collapse AND ↑ expand work. This is the Apple Maps behavior."
				/>

				<View style={styles.conceptBox}>
					<Text style={styles.conceptTitle}>Apple Maps Behavior</Text>
					<Text style={styles.conceptText}>
						At scroll boundary (scrollY = 0):{"\n\n"}• ↓ Swipe down → Collapse
						sheet{"\n"}• ↑ Swipe up → Expand sheet{"\n\n"}
						When scrolled (scrollY {">"} 0):{"\n\n"}• ↓ ↑ → ScrollView handles
						scrolling{"\n\n"}
						This creates a seamless experience where scrolling and sheet
						gestures blend together.
					</Text>
				</View>

				<View style={styles.actions}>
					<Pressable
						style={styles.button}
						onPress={() => router.push("/gestures/scroll-apple-maps/sheet")}
					>
						<Text style={styles.buttonText}>Open Apple Maps Sheet</Text>
						<Text style={styles.buttonSubtext}>
							snapPoints: [0.4, 0.7, 1.0]
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
		backgroundColor: "rgba(76, 175, 80, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(76, 175, 80, 0.3)",
	},
	conceptTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#4caf50",
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
		backgroundColor: "#4caf50",
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
