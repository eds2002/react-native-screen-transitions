import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

type Example = {
	id: string;
	title: string;
	description: string;
	scenario?: string;
};

const BASIC_EXAMPLES: Example[] = [
	{
		id: "simple-inheritance",
		title: "1. Simple Inheritance",
		description: "Child inherits vertical gesture from parent",
		scenario: "Nested/ (vertical) > A leaf (none)",
	},
	{
		id: "two-axes",
		title: "2. Two Axes, No Conflict",
		description: "Vertical parent + horizontal child coexist",
		scenario: "Nested/ (vertical) > B leaf (horizontal)",
	},
	{
		id: "same-axis-shadowing",
		title: "3. Same Axis Shadowing",
		description: "Child shadows parent's vertical gesture",
		scenario: "Nested/ (vertical) > B leaf (vertical)",
	},
];

const INTERMEDIATE_EXAMPLES: Example[] = [
	{
		id: "deep-nesting",
		title: "4. Deep Nesting (3 Levels)",
		description: "Multiple nested stacks with different gestures",
		scenario: "Nested/ (vertical) > Deeper/ (horizontal) > C leaf (vertical)",
	},
	{
		id: "inverted-gesture",
		title: "5. Inverted Gesture",
		description: "Top-to-bottom dismissal instead of bottom-to-top",
		scenario: "Nested/ (vertical-inverted) > A leaf (none)",
	},
	{
		id: "coexistence",
		title: "6. Same Axis, Different Directions",
		description: "Both vertical and vertical-inverted on same path",
		scenario: "Nested/ (vertical-inverted) > B leaf (vertical)",
	},
];

const SNAP_POINT_EXAMPLES: Example[] = [
	{
		id: "snap-shadows-axis",
		title: "7. Snap Points Shadow Axis",
		description: "Bottom sheet claims both vertical directions",
		scenario: "Nested/ (vertical) > Sheet (snap points, vertical)",
	},
	{
		id: "snap-different-axis",
		title: "8. Snap Points + Different Axis",
		description: "Horizontal drawer inherits vertical from parent",
		scenario: "Nested/ (vertical) > Drawer (snap points, horizontal)",
	},
	{
		id: "snap-deep-nesting",
		title: "9. Deep Nesting with Snap Points",
		description: "3-level nesting with snap point sheet",
		scenario:
			"Nested/ (vertical) > Deeper/ (horizontal) > Sheet (snap points, vertical)",
	},
];

const SCROLLVIEW_EXAMPLES: Example[] = [
	{
		id: "scroll-boundary",
		title: "ScrollView Boundary",
		description: "Dismiss only works at scroll top",
		scenario: "Screen (vertical) > Transition.ScrollView",
	},
	{
		id: "scroll-apple-maps",
		title: "Apple Maps Style (expandViaScrollView)",
		description: "Expand sheet from ScrollView at boundary",
		scenario: "Sheet (snap points) > expandViaScrollView: true",
	},
	{
		id: "scroll-instagram",
		title: "Instagram Style (no expandViaScrollView)",
		description: "Expand only via deadspace, collapse via scroll",
		scenario: "Sheet (snap points) > expandViaScrollView: false",
	},
];

function Section({ title, examples }: { title: string; examples: Example[] }) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{title}</Text>
			<View style={styles.list}>
				{examples.map((example) => (
					<Pressable
						key={example.id}
						testID={`gesture-${example.id}`}
						style={styles.item}
						onPress={() =>
							router.push(`/gestures/${example.id}` as `/gestures/${string}`)
						}
					>
						<Text style={styles.itemTitle}>{example.title}</Text>
						<Text style={styles.itemDescription}>{example.description}</Text>
						{example.scenario && (
							<Text style={styles.itemScenario}>{example.scenario}</Text>
						)}
					</Pressable>
				))}
			</View>
		</View>
	);
}

export default function GesturesIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Gesture Ownership"
				subtitle="Test ownership, inheritance, shadowing, and ScrollView handoff"
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<Section title="Basic Scenarios" examples={BASIC_EXAMPLES} />
				<Section
					title="Intermediate Scenarios"
					examples={INTERMEDIATE_EXAMPLES}
				/>
				<Section title="Snap Points" examples={SNAP_POINT_EXAMPLES} />
				<Section title="ScrollView Handoff" examples={SCROLLVIEW_EXAMPLES} />
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
	itemDescription: {
		fontSize: 13,
		color: "#888",
	},
	itemScenario: {
		fontSize: 11,
		color: "#4a9eff",
		marginTop: 8,
		fontFamily: "monospace",
	},
});
