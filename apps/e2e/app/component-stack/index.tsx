import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

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
		id: "embedded-flow",
		title: "Embedded Flow (Native Screens)",
		description:
			"Component stack using react-native-screens for freezing and activity state",
	},
	{
		id: "deep-link/test",
		title: "Deep Link Test",
		description: "Dynamic route for deep link testing",
	},
];

export default function ComponentStackIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
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
							style={({ pressed }) => [
								styles.item,
								{
									backgroundColor: pressed
										? theme.cardPressed
										: theme.card,
								},
							]}
							onPress={() =>
								router.push(
									`/component-stack/${demo.id}` as `/component-stack/${string}`,
								)
							}
						>
							<Text style={[styles.itemTitle, { color: theme.text }]}>
								{demo.title}
							</Text>
							<Text
								style={[
									styles.itemDescription,
									{ color: theme.textSecondary },
								]}
							>
								{demo.description}
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
