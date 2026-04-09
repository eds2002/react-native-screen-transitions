import { router } from "expo-router";
import { ListScreen } from "@/components/ui";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { GESTURE_EXAMPLES } from "./shared";

export default function GesturesSuiteIndex() {
	const stackType = useResolvedStackType();

	return (
		<ListScreen
			title="Gestures"
			subtitle="One focused route per gesture direction, including pinch"
			items={GESTURE_EXAMPLES}
			testIdPrefix="gesture-suite"
			onPress={(id) =>
				router.push(buildStackPath(stackType, `gestures/${id}`) as never)
			}
		/>
	);
}
