import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { ActionButton, DemoScreen, InfoCard } from "@/components/ui";
import { useTheme } from "@/theme";

export type GestureExampleId =
	| "horizontal"
	| "horizontal-inverted"
	| "vertical"
	| "vertical-inverted"
	| "bidirectional"
	| "pinch-in"
	| "pinch-out"
	| "dynamic-runtime";

type GestureExampleDefinition = {
	id: GestureExampleId;
	title: string;
	description: string;
	subtitle: string;
	routeLabel: string;
	tint: string;
	notes: string[];
};

export const GESTURE_EXAMPLES: GestureExampleDefinition[] = [
	{
		id: "horizontal",
		title: "Horizontal",
		description: "Standard right-edge swipe dismissal.",
		subtitle: "Pan gesture from right to left stack flow",
		routeLabel: "gestureDirection: horizontal",
		tint: "#244B74",
		notes: [
			"Push this screen and drag horizontally toward the right edge.",
			"The transition should feel like the standard card push/pop gesture.",
			"Programmatic dismiss should land back on the gesture suite index.",
		],
	},
	{
		id: "horizontal-inverted",
		title: "Horizontal Inverted",
		description: "Left-origin horizontal dismissal.",
		subtitle: "Pan gesture that enters from the left side",
		routeLabel: "gestureDirection: horizontal-inverted",
		tint: "#324A8A",
		notes: [
			"Push this screen and drag horizontally toward the left edge.",
			"Opening and closing should mirror the regular horizontal example.",
			"Touches should remain scoped to the focused screen while dragging.",
		],
	},
	{
		id: "vertical",
		title: "Vertical",
		description: "Bottom-origin vertical dismissal.",
		subtitle: "Pan gesture from bottom to top stack flow",
		routeLabel: "gestureDirection: vertical",
		tint: "#245B58",
		notes: [
			"Push this screen and drag downward to dismiss.",
			"The screen should feel like a sheet/card sliding from the bottom.",
			"Release velocity should carry the close animation naturally.",
		],
	},
	{
		id: "vertical-inverted",
		title: "Vertical Inverted",
		description: "Top-origin vertical dismissal.",
		subtitle: "Pan gesture that enters from the top edge",
		routeLabel: "gestureDirection: vertical-inverted",
		tint: "#6C4A2B",
		notes: [
			"Push this screen and drag upward to dismiss.",
			"Opening should come from the top and dismissal should return upward.",
			"Inverted direction should still respect the same drag thresholds.",
		],
	},
	{
		id: "bidirectional",
		title: "Bidirectional",
		description: "Freeform card dismissal across both axes.",
		subtitle: "Pan gesture with horizontal and vertical ownership",
		routeLabel: "gestureDirection: bidirectional",
		tint: "#5C355B",
		notes: [
			"Push this screen and drag in any direction to test freeform dismissal.",
			"Watch for smooth tracking on diagonal drags and clean spring-back.",
			"This is the quickest way to see if pan-only state stayed intact.",
		],
	},
	{
		id: "pinch-in",
		title: "Pinch In",
		description: "Two-finger inward pinch dismissal.",
		subtitle: "Pinch gesture that closes as scale contracts",
		routeLabel: "gestureDirection: pinch-in",
		tint: "#5A2944",
		notes: [
			"Use two fingers and pinch inward to dismiss this screen.",
			"Single-finger drags should not activate the old pan dismissal path.",
			"Watch for smooth scale-down plus a clean reset when the pinch cancels.",
		],
	},
	{
		id: "pinch-out",
		title: "Pinch Out",
		description: "Two-finger outward pinch dismissal.",
		subtitle: "Pinch gesture that closes as scale expands",
		routeLabel: "gestureDirection: pinch-out",
		tint: "#7A2F2F",
		notes: [
			"Use two fingers and pinch outward to dismiss this screen.",
			"Outward growth should feel deliberate instead of triggering pan.",
			"Compare this directly against pinch-in to verify both directions.",
		],
	},
	{
		id: "dynamic-runtime",
		title: "Dynamic Runtime",
		description: "Flip gesture direction and enabled state while mounted.",
		subtitle: "setOptions updates without rebuilding gesture handlers",
		routeLabel: "dynamic gestureEnabled + gestureDirection",
		tint: "#3C4F35",
		notes: [
			"Toggle gestures off, then drag to confirm the screen does not dismiss.",
			"Toggle back on and switch between horizontal, vertical, and pinch-in.",
			"Each enabled mode should dismiss without needing to remount the screen.",
		],
	},
];

export function GestureSuiteScreen({ id }: { id: GestureExampleId }) {
	const theme = useTheme();
	const stackType = useResolvedStackType();
	const suitePath = buildStackPath(stackType, "gestures");
	const stackHome = buildStackPath(stackType);
	const example = GESTURE_EXAMPLES.find((item) => item.id === id);

	if (!example) {
		return null;
	}

	return (
		<DemoScreen tint={example.tint}>
			<ScreenHeader title={example.title} subtitle={example.subtitle} light />
			<ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
				<View style={styles.hero}>
					<Text style={styles.eyebrow}>Gesture Suite</Text>
					<Text style={styles.routeLabel}>{example.routeLabel}</Text>
					<Text style={styles.description}>{example.description}</Text>
				</View>

				<InfoCard
					title="What to inspect"
					style={{
						borderWidth: StyleSheet.hairlineWidth,
						backgroundColor: theme.infoBox,
						borderColor: theme.infoBorder,
					}}
				>
					{example.notes.map((note) => (
						<Text
							key={note}
							style={[styles.note, { color: theme.textSecondary }]}
						>
							{"\u2022"} {note}
						</Text>
					))}
				</InfoCard>

				<View style={styles.actions}>
					<ActionButton
						title="Dismiss To Suite"
						onPress={() => router.dismissTo(suitePath)}
						testID={`gesture-dismiss-${example.id}`}
					/>
					<ActionButton
						title="Dismiss Outer Stack"
						onPress={() => router.dismissTo(stackHome)}
						variant="secondary"
						testID={`gesture-dismiss-stack-${example.id}`}
					/>
				</View>
			</ScrollView>
		</DemoScreen>
	);
}

const styles = StyleSheet.create({
	content: {
		padding: 16,
		gap: 16,
	},
	hero: {
		borderRadius: 24,
		padding: 20,
		backgroundColor: "rgba(255,255,255,0.1)",
		gap: 8,
	},
	eyebrow: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: "rgba(255,255,255,0.8)",
	},
	routeLabel: {
		fontSize: 28,
		fontWeight: "700",
		color: "#FFFFFF",
	},
	description: {
		fontSize: 15,
		lineHeight: 22,
		color: "rgba(255,255,255,0.84)",
	},
	note: {
		fontSize: 14,
		lineHeight: 21,
	},
	actions: {
		gap: 12,
	},
});
