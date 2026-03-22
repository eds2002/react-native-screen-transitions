import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { buildStackPath, useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

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
	const stackType = useResolvedStackType();
	const theme = useTheme();
	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top"]}>
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
							style={({ pressed }) => [
								styles.item,
								{ backgroundColor: pressed ? theme.cardPressed : theme.card },
							]}
							onPress={() =>
								router.push(
									buildStackPath(stackType, `scroll-tests/${example.id}`) as never,
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
