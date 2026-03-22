import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function SameAxisShadowingIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
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
					<View
						style={[
							styles.comparisonItem,
							{ backgroundColor: theme.card },
						]}
					>
						<Text
							style={[styles.comparisonTitle, { color: theme.text }]}
						>
							Leaf A (inherits)
						</Text>
						<Text
							style={[
								styles.comparisonText,
								{ color: theme.textSecondary },
							]}
						>
							No gesture config → inherits from parent. Swipe ↓ dismisses the
							ENTIRE stack.
						</Text>
					</View>
					<View
						style={[
							styles.comparisonItem,
							{ backgroundColor: theme.card },
						]}
					>
						<Text
							style={[styles.comparisonTitle, { color: theme.text }]}
						>
							Leaf B (shadows)
						</Text>
						<Text
							style={[
								styles.comparisonText,
								{ color: theme.textSecondary },
							]}
						>
							Has vertical gesture → shadows parent. Swipe ↓ dismisses ONLY
							leaf-b, returning to this index.
						</Text>
					</View>
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
						onPress={() => router.push("/gestures/same-axis-shadowing/leaf-a")}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Open Leaf A (inherits)
						</Text>
						<Text
							style={[
								styles.buttonSubtext,
								{ color: theme.actionButtonText, opacity: 0.7 },
							]}
						>
							↓ dismisses entire stack
						</Text>
					</Pressable>
					<Pressable
						style={({ pressed }) => [
							styles.button,
							{
								backgroundColor: pressed
									? theme.secondaryButtonPressed
									: theme.secondaryButton,
							},
						]}
						onPress={() => router.push("/gestures/same-axis-shadowing/leaf-b")}
					>
						<Text
							style={[
								styles.buttonText,
								{ color: theme.secondaryButtonText },
							]}
						>
							Open Leaf B (shadows)
						</Text>
						<Text
							style={[
								styles.buttonSubtext,
								{ color: theme.secondaryButtonText, opacity: 0.7 },
							]}
						>
							↓ dismisses only leaf-b
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
	comparison: {
		padding: 16,
		gap: 12,
	},
	comparisonItem: {
		padding: 16,
		borderRadius: 14,
	},
	comparisonTitle: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
	},
	comparisonText: {
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
