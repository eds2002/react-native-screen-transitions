import { memo } from "react";
import { useBlankStackStore } from "../providers/stack/blank-stack.provider";
import { ActivityContainer } from "./activity";
import { BlankStackHost } from "./blank-stack-host";
import { BlankStackScene } from "./blank-stack-scene";

export const BlankStackView = memo(function BlankStackView() {
	const routeKeys = useBlankStackStore((store) => store.routeKeys);

	return (
		<BlankStackHost>
			<ActivityContainer>
				{routeKeys.map((routeKey) => (
					<BlankStackScene key={routeKey} routeKey={routeKey} />
				))}
			</ActivityContainer>
		</BlankStackHost>
	);
});
