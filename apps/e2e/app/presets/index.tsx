import { router } from "expo-router";
import { buildStackPath } from "@/components/stack-examples/stack-routing";
import { useStackSelection } from "@/components/stack-examples/stack-selection";
import { PRESET_FLOWS } from "@/components/stack-examples/test-flows";
import { ListScreen } from "@/components/ui";

export default function PresetsIndex() {
	const { stackType } = useStackSelection();
	const testPrefix = stackType === "native-stack" ? "native" : "blank";

	return (
		<ListScreen
			title="Presets"
			subtitle="Built-in transition presets"
			items={PRESET_FLOWS}
			testIdPrefix={testPrefix}
			onPress={(id) => router.push(buildStackPath(stackType, id) as never)}
		/>
	);
}
