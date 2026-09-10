import { router } from "expo-router";
import { INACTIVE_BEHAVIOR_OPTIONS } from "@/components/inactive-behavior";
import { buildStackPath } from "@/components/stack-examples/stack-routing";
import { ListScreen } from "@/components/ui";

export default function InactiveBehaviorIndex() {
	const testPrefix = "blank";
	const items = INACTIVE_BEHAVIOR_OPTIONS;

	return (
		<ListScreen
			title="Inactive Behavior"
			subtitle="Push repeated routes to compare inactive screen retention"
			items={items}
			testIdPrefix={`${testPrefix}-inactive-behavior`}
			onPress={(id) => {
				router.push(buildStackPath(`inactive-behavior/${id}`) as never);
			}}
		/>
	);
}
