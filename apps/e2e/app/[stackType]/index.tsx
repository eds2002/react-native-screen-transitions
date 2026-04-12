import { router } from "expo-router";
import { ListScreen } from "@/components/ui";
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
		id: "shared-apple-music",
		title: "Shared Apple Music",
		description:
			"Deprecated SharedAppleMusic preset routed through a nested tab shell",
	},
	{
		id: "shared-x-image",
		title: "Shared X Image",
		description:
			"Deprecated SharedXImage preset for feed card -> fullscreen media",
	},
	{
		id: "shared-instagram",
		title: "Shared Instagram Preset",
		description:
			"Deprecated SharedIGImage preset for profile grid -> post detail",
	},
	{
		id: "stack-progress",
		title: "Stack Progress",
		description: "Demonstrates stackProgress accumulating across screens",
	},
	{
		id: "activity-probe",
		title: "Activity Probe",
		description:
			"Compares inert vs paused hidden-screen behavior with a live JS heartbeat",
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
		id: "gestures",
		title: "Gestures",
		description:
			"One focused route per gesture direction, including pinch-in and pinch-out",
	},
	{
		id: "nested/a",
		title: "Nested Stack Gestures",
		description:
			"Outer A/B stays horizontal while nested-b opens as a vertical child stack",
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

	return (
		<ListScreen
			title={stackLabel}
			subtitle={
				stackType === "native-stack"
					? "@react-navigation/native-stack with enableTransitions"
					: "Pure JS stack with full animation control"
			}
			items={TEST_FLOWS}
			testIdPrefix={testPrefix}
			onPress={(id) => router.push(buildStackPath(stackType, id) as never)}
		/>
	);
}
