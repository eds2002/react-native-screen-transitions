import { router } from "expo-router";
import { ListScreen } from "@/components/ui";
import { buildStackPath, useResolvedStackType } from "@/components/stack-examples/stack-routing";

const EXAMPLES = [
	{
		id: "vertical",
		title: "Vertical Scroll",
		description: "Vertical dismiss + vertical ScrollView",
	},
	{
		id: "horizontal",
		title: "Horizontal Scroll",
		description: "Horizontal dismiss + horizontal ScrollView",
	},
	{
		id: "nested",
		title: "Nested ScrollViews",
		description: "Vertical outer + horizontal inner (Netflix-style)",
	},
	{
		id: "nested-deep",
		title: "Deeply Nested",
		description: "3 levels: vertical > horizontal > vertical",
	},
];

export default function ScrollTestsIndex() {
	const stackType = useResolvedStackType();

	return (
		<ListScreen
			title="Scroll Tests"
			subtitle="No snap points - regular dismissible screens"
			items={EXAMPLES}
			testIdPrefix="scroll"
			onPress={(id) =>
				router.push(
					buildStackPath(stackType, `scroll-tests/${id}`) as never,
				)
			}
		/>
	);
}
