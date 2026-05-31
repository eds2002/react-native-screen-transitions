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
		id: "from-right",
		title: "From Right",
		description: "Sheet slides in from the right edge",
	},
	{
		id: "from-left",
		title: "From Left",
		description: "Sheet slides in from the left edge",
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
		id: "snap-lock-toggle",
		title: "Snap Lock",
		description: "Runtime lock and gesture controls with scroll coordination",
	},
	{
		id: "with-scroll",
		title: "ScrollView Integration",
		description: "Dynamic scroll handoff behavior and sheet direction",
	},
];

export default function BottomSheetIndex() {
	const stackType = useResolvedStackType();

	return (
		<ListScreen
			title="Sheets"
			subtitle="Sheet transitions across vertical and horizontal directions"
			items={EXAMPLES}
			testIdPrefix="sheet"
			onPress={(id) =>
				router.push(buildStackPath(stackType, `bottom-sheet/${id}`) as any)
			}
		/>
	);
}
