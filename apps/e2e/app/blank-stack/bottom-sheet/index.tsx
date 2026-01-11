import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.header}>Bottom Sheet Examples</Text>
				<Text style={styles.subheader}>
					Sheets with snap points and gesture dismiss
				</Text>

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

				<Pressable
					testID="back-to-blank-stack"
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Text style={styles.backButtonText}>Back</Text>
				</Pressable>
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
		padding: 20,
	},
	header: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 8,
	},
	subheader: {
		fontSize: 14,
		color: "#888",
		marginBottom: 24,
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
	backButton: {
		marginTop: 24,
		padding: 16,
		alignItems: "center",
	},
	backButtonText: {
		fontSize: 16,
		color: "#4a9eff",
	},
});
