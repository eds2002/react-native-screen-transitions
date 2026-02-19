import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { activeCaseId, type BoundsTestCase, CATEGORIES } from "./constants";

function Section({ title, cases }: { title: string; cases: BoundsTestCase[] }) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{title}</Text>
			<View style={styles.list}>
				{cases.map((testCase) => {
					const destinationBoundary = testCase.destination.boundary;
					const tags = [
						destinationBoundary?.method,
						destinationBoundary?.scaleMode,
						destinationBoundary?.anchor,
						typeof destinationBoundary?.target === "string"
							? destinationBoundary.target
							: destinationBoundary?.target
								? "custom"
								: undefined,
					]
						.filter(Boolean)
						.join(" | ");

					return (
						<Pressable
							key={testCase.id}
							testID={`sync-${testCase.id}`}
							style={styles.item}
							onPress={() => {
								activeCaseId.value = testCase.id;
								router.push("/bounds-sync/source" as never);
							}}
						>
							<Text style={styles.itemTitle}>{testCase.title}</Text>
							<Text style={styles.itemTags}>{tags}</Text>
							<Text style={styles.itemDetail}>
								{testCase.source.width}x{testCase.source.height}{" "}
								{testCase.source.position} {"\u2192"}{" "}
								{testCase.destination.width}x{testCase.destination.height}{" "}
								{testCase.destination.position}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

export default function BoundsSyncIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Bounds Sync"
				subtitle="Bulletproof sync math across all combos"
			/>
			<ScrollView contentContainerStyle={styles.content}>
				{CATEGORIES.map((cat) => (
					<Section key={cat.title} title={cat.title} cases={cat.cases} />
				))}
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
		paddingBottom: 40,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: "600",
		color: "#666",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 12,
		marginLeft: 4,
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
	itemTags: {
		fontSize: 11,
		color: "#4a9eff",
		fontFamily: "monospace",
		marginBottom: 4,
	},
	itemDetail: {
		fontSize: 12,
		color: "#666",
		fontFamily: "monospace",
	},
});
