import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

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
		id: "zoom-nested",
		title: "Nested Navigation Zoom Group",
		description:
			"Grouped zoom with nested [id]/index and [id]/plan routes plus retargeting inside dst",
	},
	{
		id: "zoom-id",
		title: "Navigation Zoom ID Transition",
		description:
			"bounds({ id }).navigation.zoom() with simple id-only matching",
	},
	{
		id: "zoom-id-nested",
		title: "Nested Navigation Zoom ID",
		description:
			"Push the same [id] detail route again from inside dst using related cards",
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
	{
		id: "example",
		title: "Nested Bounds A/B",
		description:
			"2x2 image grid -> nested [id]/a,b route flow with navigation zoom",
	},
];

export default function BoundsHubIndex() {
	const stackType = useResolvedStackType();
	const testPrefix = stackType === "native-stack" ? "native" : "blank";
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top"]}>
			<ScreenHeader title="Bounds" subtitle="Stack-scoped bounds examples" />
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.list}>
					{BOUNDS_EXAMPLES.map((example) => (
						<Pressable
							key={example.id}
							testID={`${testPrefix}-bounds-${example.id}`}
							style={({ pressed }) => [
								styles.item,
								{ backgroundColor: pressed ? theme.cardPressed : theme.card },
							]}
							onPress={() =>
								router.push(
									buildStackPath(stackType, `bounds/${example.id}`) as never,
								)
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
