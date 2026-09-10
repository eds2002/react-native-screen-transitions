import { Redirect } from "expo-router";
import { buildStackPath } from "@/components/stack-examples/stack-routing";

export default function HandoffMultiflowIndex() {
	return <Redirect href={buildStackPath("bounds/handoff-multiflow/a")} />;
}
