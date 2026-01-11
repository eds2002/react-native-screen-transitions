import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

const EXAMPLES = [
	{
		id: "vertical",
		title: "Vertical Scroll",
		description: "Vertical dismiss + vertical ScrollView",
	},
	{
		id: "horizontal",
		title: "Horizontal Scroll",
		description: "Horizontal dismiss + horizontal ScrollView",
	},
	{
		id: "nested",
		title: "Nested ScrollViews",
		description: "Vertical outer + horizontal inner (Netflix-style)",
	},
	{
		id: "nested-deep",
		title: "Deeply Nested",
		description: "3 levels: vertical > horizontal > vertical",
	},
];

export default function ScrollTestsIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Scroll Tests"
				subtitle="No snap points - regular dismissible screens"
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.list}>
					{EXAMPLES.map((example) => (
						<Pressable
							key={example.id}
							testID={`scroll-${example.id}`}
							style={styles.item}
							onPress={() =>
								router.push(
									`/blank-stack/scroll-tests/${example.id}` as `/blank-stack/scroll-tests/${string}`,
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
