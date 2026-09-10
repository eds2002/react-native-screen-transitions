import { router } from "expo-router";
import { buildStackPath } from "@/components/stack-examples/stack-routing";
import { PRESET_FLOWS } from "@/components/stack-examples/test-flows";
import { ListScreen } from "@/components/ui";

export default function PresetsIndex() {
	const testPrefix = "blank";

	return (
		<ListScreen
			title="Presets"
			subtitle="Built-in transition presets"
			items={PRESET_FLOWS}
			testIdPrefix={testPrefix}
			onPress={(id) => router.push(buildStackPath(id) as never)}
		/>
	);
}
