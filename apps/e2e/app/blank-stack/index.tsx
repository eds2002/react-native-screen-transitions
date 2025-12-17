import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TEST_FLOWS = [
	{
		id: "slide-horizontal",
		title: "Slide from Right",
		description: "Horizontal slide with swipe-to-dismiss",
	},
	{
		id: "slide-vertical",
		title: "Slide from Bottom",
		description: "Vertical slide with swipe-to-dismiss",
	},
	{
		id: "draggable-card",
		title: "Draggable Card",
		description: "Multi-directional drag with card scaling",
	},
	{
		id: "elastic-card",
		title: "Elastic Card",
		description: "Elastic drag with overlay darkening",
	},
	{
		id: "stack-progress",
		title: "Stack Progress",
		description: "Demonstrates stackProgress accumulating across screens",
	},
	{
		id: "overlay",
		title: "Floating Overlay",
		description: "Tab bar overlay that animates with screen transitions",
	},
];

export default function BlankStackIndex() {
	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.header}>Blank Stack E2E Tests</Text>
				<Text style={styles.subheader}>
					Pure JS stack with full animation control
				</Text>

				<View style={styles.list}>
					{TEST_FLOWS.map((flow) => (
						<Pressable
							key={flow.id}
							testID={`blank-${flow.id}`}
							style={styles.item}
							onPress={() =>
								router.push(`/blank-stack/${flow.id}` as `/blank-stack/${string}`)
							}
						>
							<Text style={styles.itemTitle}>{flow.title}</Text>
							<Text style={styles.itemDescription}>{flow.description}</Text>
						</Pressable>
					))}
				</View>

				<Pressable
					testID="back-home"
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Text style={styles.backButtonText}>Back to Home</Text>
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
