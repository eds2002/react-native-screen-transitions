import { router } from "expo-router";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { ListScreen } from "@/components/ui";

const BOUNDS_EXAMPLES = [
	{
		id: "style-id",
		title: "Custom Bounds Mask",
		description:
			"Custom bounds styles for the navigation mask and content container",
	},
	{
		id: "zoom",
		title: "Navigation Zoom Group Transitions",
		description:
			"bounds({ id, group }).navigation.zoom() with grouped source/destination",
	},
	{
		id: "zoom-id",
		title: "Navigation Zoom ID Transition",
		description:
			"bounds({ id }).navigation.zoom() with simple id-only matching",
	},
	{
		id: "sync",
		title: "Shared Element Sync",
		description:
			"Shared element cases for bounds, anchors, scale modes, and targets",
	},
	{
		id: "transition-scope",
		title: "Transition Scope Access",
		description:
			"Use props.transition({ depth: -1 }) to compute bounds from a nested route",
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
