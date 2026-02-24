import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";

const BOUNDS_EXAMPLES = [
	{
		id: "active",
		title: "Active Bounds",
		description:
			"Transition.Boundary id-only matching (no explicit source/destination)",
	},
	{
		id: "gesture",
		title: "Gesture Bounds",
		description: "Sync active gesture values into bounds animation",
	},
	{
		id: "style-id",
		title: "Style ID Bounds",
		description: "Combine bounds with styleId mask/container choreography",
	},
	{
		id: "spam",
		title: "Bounds Spam",
		description:
			"Rapid tap stress test for bound linkage and blank stack behavior",
	},
	{
		id: "zoom",
		title: "Navigation Zoom Group Transitions",
		description:
			"bounds({ id, group }).navigation.zoom() with grouped source/destination",
	},
	{
		id: "zoom-id",
		title: "Navigation Zoom ID Transition",
		description:
			"bounds({ id }).navigation.zoom() with simple id-only matching",
	},
	{
		id: "sync",
		title: "Bounds Sync Harness",
		description:
			"Method/anchor/scaleMode/target permutations (source -> destination only)",
	},
	{
		id: "gallery",
		title: "Gallery",
		description: "Image gallery with shared element zoom transitions",
	},
];

export default function BoundsHubIndex() {
	const stackType = useResolvedStackType();
	const testPrefix = stackType === "native-stack" ? "native" : "blank";

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader title="Bounds" subtitle="Stack-scoped bounds examples" />
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.list}>
					{BOUNDS_EXAMPLES.map((example) => (
						<Pressable
							key={example.id}
							testID={`${testPrefix}-bounds-${example.id}`}
							style={styles.item}
							onPress={() =>
								router.push(
									buildStackPath(stackType, `bounds/${example.id}`) as never,
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
