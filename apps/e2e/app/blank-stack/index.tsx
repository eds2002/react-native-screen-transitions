import { router } from "expo-router";
import { buildStackPath } from "@/components/stack-examples/stack-routing";
import { TEST_FLOWS } from "@/components/stack-examples/test-flows";
import { ListScreen } from "@/components/ui";

export default function BlankStackIndex() {
	const stackLabel = "Blank Stack";
	const testPrefix = "blank";

	return (
		<ListScreen
			title={stackLabel}
			subtitle={"Pure JS stack with full animation control"}
			items={TEST_FLOWS}
			testIdPrefix={testPrefix}
			onPress={(id) => router.push(buildStackPath(id) as never)}
		/>
	);
}
