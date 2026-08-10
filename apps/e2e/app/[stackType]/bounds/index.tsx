import { router } from "expo-router";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { ListScreen } from "@/components/ui";

const BOUNDS_EXAMPLES = [
	{
		id: "example-1/nested/nested/nested/source",
		title: "Deeply nested source → parent destination",
		description:
			"Runtime group, bound target, and clipping controls across three nested stacks",
	},
	{
		id: "example-2/source",
		title: "Parent source → deeply nested destination",
		description:
			"Runtime group, bound target, and clipping controls into three nested stacks",
	},
	{
		id: "example-3/nested-1/source",
		title: "Nested source → neighboring nested destination",
		description:
			"Runtime group, bound target, and clipping controls across sibling nested stacks",
	},
	{
		id: "style-id",
		title: ".reveal()",
		description:
			"Custom bounds styles for the navigation mask and content container",
	},
	{
		id: "zoom",
		title: ".zoom()",
		description:
			"bounds({ id, group }).navigation.zoom() with grouped source/destination",
	},
	{
		id: "sync",
		title: "Bounds API examples",
		description:
			"Shared element cases for bounds, anchors, scale modes, and targets",
	},
	{
		id: "matched-screen",
		title: "Handoff portals",
		description:
			"One video teleported to the matched screen while the destination slides",
	},
	{
		id: "handoff-multiflow",
		title: "Handoff multiflow",
		description: "One payload handed across a multi-screen push and pop flow",
	},
];

export default function BoundsHubIndex() {
	const stackType = useResolvedStackType();
	const testPrefix = stackType === "native-stack" ? "native" : "blank";

	return (
		<ListScreen
			title="Bounds"
			subtitle="Stack-scoped bounds examples"
			items={BOUNDS_EXAMPLES}
			testIdPrefix={`${testPrefix}-bounds`}
			onPress={(id) =>
				router.push(buildStackPath(stackType, `bounds/${id}`) as never)
			}
		/>
	);
}
