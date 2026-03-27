import { router } from "expo-router";
import { ListScreen } from "@/components/ui";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";

const BOUNDS_EXAMPLES = [
	{
		id: "active",
		title: "Active Bounds",
		description:
			"Transition.Boundary id-only matching (no explicit source/destination)",
	},
	{
		id: "gesture",
		title: "Gesture Bounds",
		description: "Sync active gesture values into bounds animation",
	},
	{
		id: "style-id",
		title: "Style ID Bounds",
		description: "Combine bounds with styleId mask/container choreography",
	},
	{
		id: "spam",
		title: "Bounds Spam",
		description:
			"Rapid tap stress test for bound linkage and blank stack behavior",
	},
	{
		id: "zoom",
		title: "Navigation Zoom Group Transitions",
		description:
			"bounds({ id, group }).navigation.zoom() with grouped source/destination",
	},
	{
		id: "zoom-nested",
		title: "Nested Navigation Zoom Group",
		description:
			"Grouped zoom with nested [id]/index and [id]/plan routes plus retargeting inside dst",
	},
	{
		id: "zoom-id",
		title: "Navigation Zoom ID Transition",
		description:
			"bounds({ id }).navigation.zoom() with simple id-only matching",
	},
	{
		id: "music-player",
		title: "Music Player Zoom",
		description:
			"Playlist row with nested Boundary.Target artwork -> fullscreen Boundary.View artwork",
	},
	{
		id: "zoom-id-nested",
		title: "Nested Navigation Zoom ID",
		description:
			"Push the same [id] detail route again from inside dst using related cards",
	},
	{
		id: "sync",
		title: "Bounds Sync Harness",
		description:
			"Method/anchor/scaleMode/target permutations (source -> destination only)",
	},
	{
		id: "gallery",
		title: "Vertical Gallery",
		description: "Vertical image gallery with shared element zoom transitions",
	},
	{
		id: "gallery-horizontal",
		title: "Horizontal Gallery",
		description: "Horizontal image carousel with shared element zoom transitions",
	},
	{
		id: "example",
		title: "Nested Bounds A/B",
		description:
			"2x2 image grid -> nested [id]/a,b route flow with navigation zoom",
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
				router.push(
					buildStackPath(stackType, `bounds/${id}`) as never,
				)
			}
		/>
	);
}
