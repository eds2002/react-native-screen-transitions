import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { type Theme, useTheme } from "@/theme";

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
	{
		id: "pinch-shadowing",
		title: "Pinch Shadowing Probe",
		description:
			"Observe raw nested pinch behavior before formal pinch ownership",
		scenario: "Parent (pinch-in + pinch-out) > child (none / pinch / vertical)",
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

const REGRESSION_EXAMPLES: Example[] = [
	{
		id: "claim-fallback",
		title: "Claim Fallback Chain",
		description:
			"After top claim unmount, ownership should fall back to nearest",
		scenario: "L1 (vertical) > L2 (vertical) > L3 (vertical)",
	},
	{
		id: "snap-locked-no-bubble",
		title: "Locked Snap No Bubble",
		description: "Locked no-dismiss sheet should not bubble to ancestor",
		scenario: "Parent (vertical) > Sheet (snap lock + no dismiss)",
	},
];

const SCROLLVIEW_EXAMPLES: Example[] = [
	{
		id: "scroll-direction-propagation",
		title: "Scroll Direction Propagation",
		description: "ScrollView coordinates with two owners on same axis",
		scenario: "Outer/ (vertical) > Settings/ (vertical-inverted) > ScrollView",
	},
	{
		id: "scroll-direction-propagation-horizontal",
		title: "Scroll Direction Propagation (Horizontal)",
		description:
			"Horizontal ScrollView coordinates with two owners on same axis",
		scenario:
			"Outer/ (horizontal) > Drawer/ (horizontal-inverted) > ScrollView",
	},
	{
		id: "scroll-boundary",
		title: "ScrollView Boundary",
		description: "Dismiss only works at scroll top",
		scenario: "Screen (vertical) > Transition.ScrollView",
	},
	{
		id: "scroll-apple-maps",
		title: "Apple Maps Style (expand-and-collapse)",
		description: "Expand sheet from ScrollView at boundary",
		scenario:
			'Sheet (snap points) > sheetScrollGestureBehavior: "expand-and-collapse"',
	},
	{
		id: "scroll-instagram",
		title: "Instagram Style (collapse-only)",
		description: "Expand only via deadspace, collapse via scroll",
		scenario:
			'Sheet (snap points) > sheetScrollGestureBehavior: "collapse-only"',
	},
];

function Section({
	title,
	examples,
	theme,
}: {
	title: string;
	examples: Example[];
	theme: Theme;
}) {
	return (
		<View style={styles.section}>
			<Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
				{title}
			</Text>
			<View style={styles.list}>
				{examples.map((example) => (
					<Pressable
						key={example.id}
						testID={`gesture-${example.id}`}
						style={({ pressed }) => [
							styles.item,
							{
								backgroundColor: pressed ? theme.cardPressed : theme.card,
							},
						]}
						onPress={() => router.push(`/gestures/${example.id}` as never)}
					>
						<Text style={[styles.itemTitle, { color: theme.text }]}>
							{example.title}
						</Text>
						<Text
							style={[styles.itemDescription, { color: theme.textSecondary }]}
						>
							{example.description}
						</Text>
						{example.scenario && (
							<Text style={[styles.itemScenario, { color: theme.scenario }]}>
								{example.scenario}
							</Text>
						)}
					</Pressable>
				))}
			</View>
		</View>
	);
}

export default function GesturesIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Gesture Ownership"
				subtitle="Test ownership, inheritance, shadowing, and ScrollView handoff"
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<Section
					title="Basic Scenarios"
					examples={BASIC_EXAMPLES}
					theme={theme}
				/>
				<Section
					title="Intermediate Scenarios"
					examples={INTERMEDIATE_EXAMPLES}
					theme={theme}
				/>
				<Section
					title="Snap Points"
					examples={SNAP_POINT_EXAMPLES}
					theme={theme}
				/>
				<Section
					title="Regression Visuals"
					examples={REGRESSION_EXAMPLES}
					theme={theme}
				/>
				<Section
					title="ScrollView Handoff"
					examples={SCROLLVIEW_EXAMPLES}
					theme={theme}
				/>
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
	itemScenario: {
		fontSize: 11,
		marginTop: 8,
		fontFamily: "monospace",
	},
});
