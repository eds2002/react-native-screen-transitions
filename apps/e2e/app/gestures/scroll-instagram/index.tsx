import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function InstagramIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Instagram Style"
				subtitle='sheetScrollGestureBehavior: "collapse-only"'
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<GestureInfo
					title="Test: Expand via deadspace only"
					structure={`sheet (snapPoints: [0.4, 0.7, 1.0])
  sheetScrollGestureBehavior: "collapse-only"
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

				<View style={[styles.conceptBox, { backgroundColor: theme.infoBox }]}>
					<Text style={[styles.conceptTitle, { color: theme.text }]}>
						Instagram Behavior
					</Text>
					<Text style={[styles.conceptText, { color: theme.textSecondary }]}>
						<Text style={[styles.highlight, { color: theme.text }]}>
							Via Deadspace (handle):
						</Text>
						{"\n"}• ↓ Swipe down → Collapse sheet{"\n"}• ↑ Swipe up → Expand
						sheet{"\n\n"}
						<Text style={[styles.highlight, { color: theme.text }]}>
							Via ScrollView (any position):
						</Text>
						{"\n"}• ↓ Swipe down → Collapse (if at top) or scroll{"\n"}• ↑ Swipe
						up → ALWAYS scroll (never expands){"\n\n"}
						This prevents accidental expansion when scrolling content.
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
						onPress={() => router.push("/gestures/scroll-instagram/sheet")}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Open Instagram Sheet
						</Text>
						<Text
							style={[
								styles.buttonSubtext,
								{ color: theme.actionButtonText, opacity: 0.7 },
							]}
						>
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
	highlight: {
		fontWeight: "600",
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
