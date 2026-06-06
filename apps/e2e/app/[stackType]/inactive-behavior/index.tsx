import { router } from "expo-router";
import { INACTIVE_BEHAVIOR_OPTIONS } from "@/components/inactive-behavior";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { ListScreen } from "@/components/ui";

export default function InactiveBehaviorIndex() {
	const stackType = useResolvedStackType();
	const testPrefix = stackType === "native-stack" ? "native" : "blank";
	const items =
		stackType === "native-stack"
			? INACTIVE_BEHAVIOR_OPTIONS.map((option) => ({
					...option,
					scenario: `${option.scenario}; BlankStack-only retention policy`,
				}))
			: INACTIVE_BEHAVIOR_OPTIONS;

	return (
		<ListScreen
			title="Inactive Behavior"
			subtitle="Push repeated routes to compare inactive screen retention"
			items={items}
			testIdPrefix={`${testPrefix}-inactive-behavior`}
			onPress={(id) => {
				router.push(
					buildStackPath(stackType, `inactive-behavior/${id}`) as never,
				);
			}}
		/>
	);
}
