import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";

const TEST_FLOWS = [
	{
		id: "slide-horizontal",
		title: "Slide from Right",
		description: "Horizontal slide with swipe-to-dismiss",
	},
	{
		id: "slide-vertical",
		title: "Slide from Bottom",
		description: "Vertical slide with swipe-to-dismiss",
	},
	{
		id: "draggable-card",
		title: "Draggable Card",
		description: "Multi-directional drag with card scaling",
	},
	{
		id: "elastic-card",
		title: "Elastic Card",
		description: "Elastic drag with overlay darkening",
	},
	{
		id: "stack-progress",
		title: "Stack Progress",
		description: "Demonstrates stackProgress accumulating across screens",
	},
	{
		id: "overlay",
		title: "Floating Overlay",
		description: "Tab bar overlay that animates with screen transitions",
	},
	{
		id: "custom-backdrop",
		title: "Custom Backdrop",
		description:
			"BlurView backdrop component with animated intensity and opacity",
	},
	{
		id: "custom-background",
		title: "Custom Surface",
		description:
			"Fast squircle surface component with animated corner smoothing",
	},
	{
		id: "bottom-sheet",
		title: "Bottom Sheet",
		description: "Vertical sheet with snap points",
	},
	{
		id: "scroll-tests",
		title: "Scroll Tests",
		description: "ScrollView + gesture coordination (no snap points)",
	},
	{
		id: "deep-link/test",
		title: "Deep Link Test",
		description: "Dynamic route for deep link testing",
	},
	{
		id: "touch-gating",
		title: "Touch Gating",
		description: "Demonstrates proper touch blocking during transitions",
	},
	{
		id: "bounds",
		title: "Bounds",
		description:
			"All bounds examples: active, gesture, styleId, spam, zoom, sync",
	},
];

const BLANK_STACK_ONLY_FLOWS = [
	{
		id: "embedded-flow",
		title: "Embedded Blank Stack",
		description:
			"Compare isolated blank-stack mode with native screens on and off",
	},
];

export default function BlankStackIndex() {
	const stackType = useResolvedStackType();
	const stackLabel =
		stackType === "native-stack" ? "Native Stack" : "Blank Stack";
	const testPrefix = stackType === "native-stack" ? "native" : "blank";
	const flows =
		stackType === "blank-stack"
			? [...BLANK_STACK_ONLY_FLOWS, ...TEST_FLOWS]
			: TEST_FLOWS;
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title={stackLabel}
				subtitle={
					stackType === "native-stack"
						? "@react-navigation/native-stack with enableTransitions"
						: "Pure JS stack with full animation control"
				}
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.list}>
					{flows.map((flow) => (
						<Pressable
							key={flow.id}
							testID={`${testPrefix}-${flow.id}`}
							style={styles.item}
							onPress={() =>
								router.push(buildStackPath(stackType, `${flow.id}`) as never)
							}
						>
							<Text style={styles.itemTitle}>{flow.title}</Text>
							<Text style={styles.itemDescription}>{flow.description}</Text>
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
