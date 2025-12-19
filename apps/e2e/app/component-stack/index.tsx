import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EXAMPLES = [
	{
		id: "basic",
		title: "Basic Navigation",
		description: "Push, pop, navigate, and reset operations",
	},
	{
		id: "floating-bar",
		title: "Floating Bar Animation",
		description: "Expandable mask transition with dynamic sizing",
	},
];

export default function ComponentStackIndex() {
	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.header}>Component Stack Examples</Text>
				<Text style={styles.subheader}>
					Standalone navigation within components - no URL routing
				</Text>

				<View style={styles.list}>
					{EXAMPLES.map((example) => (
						<Pressable
							key={example.id}
							testID={`component-${example.id}`}
							style={styles.item}
							onPress={() =>
								router.push(
									`/component-stack/${example.id}` as `/component-stack/${string}`,
								)
							}
						>
							<Text style={styles.itemTitle}>{example.title}</Text>
							<Text style={styles.itemDescription}>{example.description}</Text>
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
