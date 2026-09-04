import { memo } from "react";
import { ScreenComposer } from "../providers/screen/screen-composer";
import { useBlankStackStore } from "../providers/stack/blank-stack.provider";
import { ActivityScreen } from "./activity";

export type BlankStackSceneProps = {
	routeKey: string;
};

const BlankStackSceneContent = memo(function BlankStackSceneContent({
	routeKey,
}: BlankStackSceneProps) {
	const render = useBlankStackStore(
		(store) => store.scenesByKey[routeKey]?.descriptor.render,
	);

	return render?.();
});

export const BlankStackScene = memo(function BlankStackScene({
	routeKey,
}: BlankStackSceneProps) {
	return (
		<ActivityScreen routeKey={routeKey}>
			<ScreenComposer routeKey={routeKey}>
				<BlankStackSceneContent routeKey={routeKey} />
			</ScreenComposer>
		</ActivityScreen>
	);
});
