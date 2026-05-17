import { router } from "expo-router";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { BACKDROP_FLOWS } from "@/components/stack-examples/test-flows";
import { ListScreen } from "@/components/ui";

export default function BackdropStackIndex() {
	const stackType = useResolvedStackType();
	const testPrefix = stackType === "native-stack" ? "native" : "blank";

	return (
		<ListScreen
			title="Backdrop"
			subtitle="Backdrop components and tap behavior"
			items={BACKDROP_FLOWS}
			testIdPrefix={testPrefix}
			onPress={(id) =>
				router.push(buildStackPath(stackType, `backdrop/${id}`) as never)
			}
		/>
	);
}
