import { router } from "expo-router";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { TEST_FLOWS } from "@/components/stack-examples/test-flows";
import { ListScreen } from "@/components/ui";

export default function BlankStackIndex() {
	const stackType = useResolvedStackType();
	const stackLabel =
		stackType === "native-stack" ? "Native Stack" : "Blank Stack";
	const testPrefix = stackType === "native-stack" ? "native" : "blank";

	return (
		<ListScreen
			title={stackLabel}
			subtitle={
				stackType === "native-stack"
					? "@react-navigation/native-stack with enableTransitions"
					: "Pure JS stack with full animation control"
			}
			items={TEST_FLOWS}
			testIdPrefix={testPrefix}
			onPress={(id) => router.push(buildStackPath(stackType, id) as never)}
		/>
	);
}
