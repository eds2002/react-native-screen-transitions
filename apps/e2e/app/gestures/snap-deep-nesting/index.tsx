import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function SnapDeepNestingIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="9. Deep Nesting with Snap Points"
				subtitle="3 levels: vertical > horizontal > sheet"
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<GestureInfo
					title="Complex scenario: Snap sheet in nested stacks"
					structure={`gestures/snap-deep-nesting/  (vertical)    ← L1
  └─ deeper/                   (horizontal)   ← L2
       └─ sheet (snapPoints, vertical)        ← L3`}
					behaviors={[
						{
							direction: "down",
							owner: "This stack (L1)",
							result: "Dismisses entire L1 stack",
						},
					]}
					note="Navigate to deeper/ to see the full 3-level hierarchy with snap points."
				/>

				<View
					style={[styles.conceptBox, { backgroundColor: theme.infoBox }]}
				>
					<Text style={[styles.conceptTitle, { color: theme.text }]}>
						What Makes This Complex
					</Text>
					<Text
						style={[styles.conceptText, { color: theme.textSecondary }]}
					>
						L1 has vertical, L2 has horizontal, L3 (sheet) has vertical snap
						points.{"\n\n"}
						On the sheet:{"\n"}• ↓ ↑ are owned by sheet (shadows L1){"\n"}• → is
						inherited from L2{"\n"}• ← nothing
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
						onPress={() => router.push("/gestures/snap-deep-nesting/deeper")}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Go Deeper (L2)
						</Text>
						<Text
							style={[
								styles.buttonSubtext,
								{ color: theme.actionButtonText, opacity: 0.7 },
							]}
						>
							Horizontal stack with sheet
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
