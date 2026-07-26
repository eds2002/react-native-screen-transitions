import { Redirect } from "expo-router";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";

export default function HandoffMultiflowIndex() {
	const stackType = useResolvedStackType();

	return (
		<Redirect href={buildStackPath(stackType, "bounds/handoff-multiflow/a")} />
	);
}
