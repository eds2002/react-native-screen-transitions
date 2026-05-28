import { router } from "expo-router";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { TEST_FLOWS } from "@/components/stack-examples/test-flows";
import { ListScreen } from "@/components/ui";

export default function BlankStackIndex() {
	const stackType = useResolvedStackType();
	const testPrefix = "blank";

	return (
		<ListScreen
			title="Blank Stack"
			subtitle="Pure JS stack with full animation control"
			items={TEST_FLOWS}
			testIdPrefix={testPrefix}
			onPress={(id) => router.push(buildStackPath(stackType, id) as never)}
		/>
	);
}
