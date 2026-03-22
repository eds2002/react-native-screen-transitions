import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { buildStackPath, useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

const EXAMPLES = [
	{
		id: "from-bottom",
		title: "From Bottom",
		description: "Sheet slides up from the bottom edge",
	},
	{
		id: "from-top",
		title: "From Top",
		description: "Sheet slides down from the top edge",
	},
	{
		id: "with-resistance",
		title: "With Resistance",
		description: "Apple Maps style with 3 detents and rubber-band",
	},
	{
		id: "horizontal-drawer",
		title: "Horizontal Drawer",
		description: "Side panel that slides from the right edge",
	},
	{
		id: "multi-snap",
		title: "Multi Snap",
		description: "Stress test with 5 snap points (20-100%)",
	},
	{
		id: "auto-snap",
		title: "Auto Snap",
		description: "Opens to intrinsic content height, then expands to full screen",
	},
	{
		id: "snap-index-animation",
		title: "Snap Index Animation",
		description: "Animate UI based on snapIndex value",
	},
	{
		id: "snap-lock-unlocked",
		title: "Snap Lock (Unlocked)",
		description: "Baseline: gestures can move across all snap points",
	},
	{
		id: "snap-lock-locked",
		title: "Snap Lock (Locked)",
		description: "Gesture snapping locked; dismiss + snapTo still work",
	},
	{
		id: "snap-lock-toggle",
		title: "Snap Lock (Dynamic Toggle)",
		description: "Toggle lock at runtime and verify gesture behavior",
	},
	{
		id: "snap-lock-horizontal-locked",
		title: "Snap Lock (Horizontal)",
		description: "Axis check: horizontal drawer with gesture lock",
	},
	{
		id: "snap-lock-scroll-locked",
		title: "Snap Lock (ScrollView)",
		description: "Scroll + sheet coordination with snap lock enabled",
	},
	{
		id: "snap-lock-locked-no-dismiss",
		title: "Snap Lock (No Dismiss)",
		description: "gestureEnabled=false: no dismiss, no gesture snapping",
	},
	{
		id: "backdrop-dismiss",
		title: "Backdrop Dismiss",
		description: "Tap outside the sheet to dismiss",
	},
	{
		id: "passthrough",
		title: "Passthrough",
		description: "Interact with content behind the sheet",
	},
	{
		id: "with-scroll",
		title: "With ScrollView",
		description: "Scrollable content with gesture coordination",
	},
	{
		id: "with-scroll-inverted",
		title: "With ScrollView (Inverted)",
		description: "Top sheet with scrollable content",
	},
	{
		id: "with-scroll-horizontal",
		title: "Horizontal ScrollView",
		description: "Right drawer with horizontal scroll",
	},
	{
		id: "with-scroll-horizontal-inverted",
		title: "Horizontal ScrollView (Inverted)",
		description: "Left drawer with horizontal scroll",
	},
];

export default function BottomSheetIndex() {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top"]}>
			<ScreenHeader
				title="Bottom Sheet"
				subtitle="Sheets with snap points and gesture dismiss"
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.list}>
					{EXAMPLES.map((example) => (
						<Pressable
							key={example.id}
							testID={`sheet-${example.id}`}
							style={({ pressed }) => [
								styles.item,
								{ backgroundColor: pressed ? theme.cardPressed : theme.card },
							]}
							onPress={() =>
								router.push(buildStackPath(stackType, `bottom-sheet/${example.id}`) as any)
							}
						>
							<Text style={[styles.itemTitle, { color: theme.text }]}>
								{example.title}
							</Text>
							<Text style={[styles.itemDescription, { color: theme.textSecondary }]}>
								{example.description}
							</Text>
						</Pressable>
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	list: {
		gap: 10,
	},
	item: {
		padding: 16,
		borderRadius: 14,
	},
	itemTitle: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 4,
	},
	itemDescription: {
		fontSize: 13,
	},
});
