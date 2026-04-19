import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function AppleMapsIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Apple Maps Style"
				subtitle='sheetScrollGestureBehavior: "expand-and-collapse"'
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<GestureInfo
					title="Test: Expand AND collapse via ScrollView"
					structure={`sheet (snapPoints: [0.4, 0.7, 1.0])
  sheetScrollGestureBehavior: "expand-and-collapse"
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

				<View
					style={[styles.conceptBox, { backgroundColor: theme.infoBox }]}
				>
					<Text style={[styles.conceptTitle, { color: theme.text }]}>
						Apple Maps Behavior
					</Text>
					<Text
						style={[styles.conceptText, { color: theme.textSecondary }]}
					>
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
						style={({ pressed }) => [
							styles.button,
							{
								backgroundColor: pressed
									? theme.actionButtonPressed
									: theme.actionButton,
							},
						]}
						onPress={() => router.push("/gestures/scroll-apple-maps/sheet")}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Open Apple Maps Sheet
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
