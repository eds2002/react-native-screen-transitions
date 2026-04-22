import { router } from "expo-router";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { ListScreen } from "@/components/ui";

const EXAMPLES = [
	{
		id: "from-bottom",
		title: "From Bottom",
		description: "Sheet slides up from the bottom edge",
	},
	{
		id: "from-top",
		title: "From Top",
		description: "Sheet slides down from the top edge",
	},
	{
		id: "with-resistance",
		title: "With Resistance",
		description: "Apple Maps style with 3 detents and rubber-band",
	},
	{
		id: "horizontal-drawer",
		title: "Horizontal Drawer",
		description: "Side panel that slides from the right edge",
	},
	{
		id: "multi-snap",
		title: "Multi Snap",
		description: "Stress test with 5 snap points (20-100%)",
	},
	{
		id: "auto-snap",
		title: "Auto Snap",
		description:
			"Opens to intrinsic content height, then expands to full screen",
	},
	{
		id: "snap-index-animation",
		title: "Snap Index Animation",
		description: "Animate UI based on animatedSnapIndex value",
	},
	{
		id: "snap-lock-unlocked",
		title: "Snap Lock (Unlocked)",
		description: "Baseline: gestures can move across all snap points",
	},
	{
		id: "snap-lock-locked",
		title: "Snap Lock (Locked)",
		description: "Gesture snapping locked; dismiss + snapTo still work",
	},
	{
		id: "snap-lock-toggle",
		title: "Snap Lock (Dynamic Toggle)",
		description: "Toggle lock at runtime and verify gesture behavior",
	},
	{
		id: "snap-lock-horizontal-locked",
		title: "Snap Lock (Horizontal)",
		description: "Axis check: horizontal drawer with gesture lock",
	},
	{
		id: "snap-lock-scroll-locked",
		title: "Snap Lock (ScrollView)",
		description: "Scroll + sheet coordination with snap lock enabled",
	},
	{
		id: "snap-lock-locked-no-dismiss",
		title: "Snap Lock (No Dismiss)",
		description: "gestureEnabled=false: no dismiss, no gesture snapping",
	},
	{
		id: "backdrop-dismiss",
		title: "Backdrop Dismiss",
		description: "Tap outside the sheet to dismiss",
	},
	{
		id: "passthrough",
		title: "Passthrough",
		description: "Interact with content behind the sheet",
	},
	{
		id: "with-scroll",
		title: "With ScrollView",
		description: "Scrollable content with gesture coordination",
	},
	{
		id: "with-scroll-inverted",
		title: "With ScrollView (Inverted)",
		description: "Top sheet with scrollable content",
	},
	{
		id: "with-scroll-horizontal",
		title: "Horizontal ScrollView",
		description: "Right drawer with horizontal scroll",
	},
	{
		id: "with-scroll-horizontal-inverted",
		title: "Horizontal ScrollView (Inverted)",
		description: "Left drawer with horizontal scroll",
	},
];

export default function BottomSheetIndex() {
	const stackType = useResolvedStackType();

	return (
		<ListScreen
			title="Bottom Sheet"
			subtitle="Sheets with snap points and gesture dismiss"
			items={EXAMPLES}
			testIdPrefix="sheet"
			onPress={(id) =>
				router.push(buildStackPath(stackType, `bottom-sheet/${id}`) as any)
			}
		/>
	);
}
