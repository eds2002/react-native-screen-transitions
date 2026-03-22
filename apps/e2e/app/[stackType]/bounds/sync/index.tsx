import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { activeCaseId, type BoundsTestCase, CATEGORIES } from "./constants";
import { useTheme } from "@/theme";

function Section({
	title,
	cases,
	stackType,
}: {
	title: string;
	cases: BoundsTestCase[];
	stackType: "blank-stack" | "native-stack";
}) {
	const theme = useTheme();
	return (
		<View style={styles.section}>
			<Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>{title}</Text>
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
							style={({ pressed }) => [
								styles.item,
								{ backgroundColor: pressed ? theme.cardPressed : theme.card },
							]}
							onPress={() => {
								activeCaseId.value = testCase.id;
								router.push(buildStackPath(stackType, "bounds/sync/source") as never);
							}}
						>
							<Text style={[styles.itemTitle, { color: theme.text }]}>{testCase.title}</Text>
							<Text style={[styles.itemTags, { color: theme.activePillText }]}>{tags}</Text>
							<Text style={[styles.itemDetail, { color: theme.textTertiary }]}>
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
	const stackType = useResolvedStackType();
	const theme = useTheme();
	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top"]}>
			<ScreenHeader
				title="Bounds Sync"
				subtitle="Element transitions (A/B boundary sync)"
			/>
			<ScrollView contentContainerStyle={styles.content}>
				{CATEGORIES.map((cat) => (
					<Section
						key={cat.title}
						title={cat.title}
						cases={cat.cases}
						stackType={stackType}
					/>
				))}
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
		paddingBottom: 40,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 12,
		marginLeft: 4,
	},
	list: {
		gap: 12,
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
	itemTags: {
		fontSize: 11,
		fontFamily: "monospace",
		marginBottom: 4,
	},
	itemDetail: {
		fontSize: 12,
		fontFamily: "monospace",
	},
});
