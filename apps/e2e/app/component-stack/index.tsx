import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

const DEMOS = [
	{
		id: "music-player",
		title: "Music Player",
		description: "Spotify-style mini player with shared bounds transition",
	},
	{
		id: "story-viewer",
		title: "Story Viewer",
		description: "Instagram-style stories with auto-advance and gestures",
	},
	{
		id: "onboarding",
		title: "Onboarding",
		description: "Multi-step wizard with horizontal slide transitions",
	},
	{
		id: "size-transitions",
		title: "Size Transitions",
		description: "Shared element bounds between different card sizes",
	},
	{
		id: "deep-link/test",
		title: "Deep Link Test",
		description: "Dynamic route for deep link testing",
	},
];

export default function ComponentStackIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Component Stack"
				subtitle="Standalone navigators isolated from React Navigation"
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.list}>
					{DEMOS.map((demo) => (
						<Pressable
							key={demo.id}
							testID={`component-${demo.id}`}
							style={styles.item}
							onPress={() =>
								router.push(
									`/component-stack/${demo.id}` as `/component-stack/${string}`,
								)
							}
						>
							<Text style={styles.itemTitle}>{demo.title}</Text>
							<Text style={styles.itemDescription}>{demo.description}</Text>
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
