import { router } from "expo-router";
import { useStackSelection } from "@/components/stack-examples/stack-selection";
import { BACKDROP_FLOWS } from "@/components/stack-examples/test-flows";
import { ListScreen } from "@/components/ui";

export default function BackdropIndex() {
	const { stackType } = useStackSelection();
	const testPrefix = stackType === "native-stack" ? "native" : "blank";

	return (
		<ListScreen
			title="Backdrop"
			subtitle="Backdrop components and tap behavior"
			items={BACKDROP_FLOWS}
			testIdPrefix={testPrefix}
			onPress={(id) => router.push(`/backdrop/${id}` as never)}
		/>
	);
}
