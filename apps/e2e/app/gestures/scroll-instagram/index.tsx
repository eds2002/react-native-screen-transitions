import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function InstagramIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Instagram Style"
				subtitle="expandViaScrollView: false"
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<GestureInfo
					title="Test: Expand via deadspace only"
					structure={`sheet (snapPoints: [0.4, 0.7, 1.0])
  expandViaScrollView: false
  └─ Transition.ScrollView`}
					behaviors={[
						{
							direction: "down",
							owner: "Sheet",
							result: "Collapse (at boundary) or scroll",
						},
						{
							direction: "up",
							owner: "ScrollView",
							result: "Scroll (never expands from ScrollView)",
						},
					]}
					note="Expand ONLY works via deadspace (handle/header). From ScrollView, ↑ always scrolls."
				/>

				<View style={styles.conceptBox}>
					<Text style={styles.conceptTitle}>Instagram Behavior</Text>
					<Text style={styles.conceptText}>
						<Text style={styles.highlight}>Via Deadspace (handle):</Text>
						{"\n"}• ↓ Swipe down → Collapse sheet{"\n"}• ↑ Swipe up → Expand
						sheet{"\n\n"}
						<Text style={styles.highlight}>Via ScrollView (any position):</Text>
						{"\n"}• ↓ Swipe down → Collapse (if at top) or scroll{"\n"}• ↑ Swipe
						up → ALWAYS scroll (never expands){"\n\n"}
						This prevents accidental expansion when scrolling content.
					</Text>
				</View>

				<View style={styles.actions}>
					<Pressable
						style={styles.button}
						onPress={() => router.push("/gestures/scroll-instagram/sheet")}
					>
						<Text style={styles.buttonText}>Open Instagram Sheet</Text>
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
		backgroundColor: "rgba(233, 30, 99, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(233, 30, 99, 0.3)",
	},
	conceptTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#e91e63",
		marginBottom: 8,
	},
	conceptText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.8)",
		lineHeight: 20,
	},
	highlight: {
		color: "#e91e63",
		fontWeight: "600",
	},
	actions: {
		padding: 16,
		gap: 12,
	},
	button: {
		backgroundColor: "#e91e63",
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
