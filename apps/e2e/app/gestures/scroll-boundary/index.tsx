import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function ScrollBoundaryIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
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

			<View
				style={[styles.ruleBox, { backgroundColor: theme.noteBox }]}
			>
				<Text style={[styles.ruleTitle, { color: theme.noteText }]}>
					The Golden Rule
				</Text>
				<Text style={[styles.ruleText, { color: theme.textSecondary }]}>
					A ScrollView must be at its boundary before it yields control to
					gestures.
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
					onPress={() => router.push("/gestures/scroll-boundary/screen")}
				>
					<Text
						style={[styles.buttonText, { color: theme.actionButtonText }]}
					>
						Open Screen with ScrollView
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	ruleBox: {
		margin: 16,
		borderRadius: 14,
		padding: 16,
	},
	ruleTitle: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
	},
	ruleText: {
		fontSize: 14,
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
});
