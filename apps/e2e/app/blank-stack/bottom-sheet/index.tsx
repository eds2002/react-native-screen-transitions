import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

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
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
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
							style={styles.item}
							onPress={() =>
								router.push(
									`/blank-stack/bottom-sheet/${example.id}` as `/blank-stack/bottom-sheet/${string}`,
								)
							}
						>
							<Text style={styles.itemTitle}>{example.title}</Text>
							<Text style={styles.itemDescription}>{example.description}</Text>
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
		backgroundColor: "#121212",
	},
	content: {
		padding: 16,
	},
	list: {
		gap: 12,
	},
	item: {
		backgroundColor: "#1e1e1e",
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#333",
	},
	itemTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 4,
	},
	itemDescription: {
		fontSize: 13,
		color: "#888",
	},
});
