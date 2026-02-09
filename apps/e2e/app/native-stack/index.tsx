import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

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
		id: "zoom",
		title: "Zoom In",
		description: "Scale animation with fade",
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
		id: "deep-link/test",
		title: "Deep Link Test",
		description: "Dynamic route for deep link testing",
	},
	{
		id: "active-bounds",
		title: "Active Bounds",
		description: "Shared element bounds animation with dynamic bound tags",
	},
	{
		id: "gesture-bounds",
		title: "Gesture Bounds",
		description: "Bounds animation with gesture syncing and drag feedback",
	},
	{
		id: "style-id-bounds",
		title: "Style ID Bounds",
		description: "Bounds with styleId masking for complex shared transitions",
	},
];

export default function NativeStackIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Native Stack"
				subtitle="@react-navigation/native-stack with enableTransitions"
			/>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.list}>
					{TEST_FLOWS.map((flow) => (
						<Pressable
							key={flow.id}
							testID={`native-${flow.id}`}
							style={styles.item}
							onPress={() =>
								router.push(
									`/native-stack/${flow.id}` as `/native-stack/${string}`,
								)
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
