import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

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
		id: "embedded-navigator",
		title: "Embedded Navigator",
		description:
			"Independent blank stack with nested album → tracks → player flow",
	},
	{
		id: "bounds",
		title: "Bounds",
		description:
			"All bounds examples: active, gesture, styleId, spam, zoom, sync",
	},
];

export default function BlankStackIndex() {
	const stackType = useResolvedStackType();
	const stackLabel =
		stackType === "native-stack" ? "Native Stack" : "Blank Stack";
	const testPrefix = stackType === "native-stack" ? "native" : "blank";
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
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
					{TEST_FLOWS.map((flow) => (
						<Pressable
							key={flow.id}
							testID={`${testPrefix}-${flow.id}`}
							style={({ pressed }) => [
								styles.item,
								{
									backgroundColor: pressed
										? theme.cardPressed
										: theme.card,
								},
							]}
							onPress={() =>
								router.push(buildStackPath(stackType, `${flow.id}`) as never)
							}
						>
							<Text style={[styles.itemTitle, { color: theme.text }]}>
								{flow.title}
							</Text>
							<Text
								style={[
									styles.itemDescription,
									{ color: theme.textSecondary },
								]}
							>
								{flow.description}
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
