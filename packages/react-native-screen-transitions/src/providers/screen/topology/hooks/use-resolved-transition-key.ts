import { useCallback, useSyncExternalStore } from "react";
import type { ScreenTransitionTarget } from "../../../../types/animation.types";
import { screenTopology } from "../helpers/create-screen-topology";

export const useResolvedTransitionKey = (
	screenKey: string,
	target?: ScreenTransitionTarget,
) => {
	const depth = typeof target === "string" ? null : (target?.depth ?? 0);
	const isRelative = depth !== null && depth !== 0;
	const subscribe = useCallback(
		(listener: () => void) =>
			isRelative ? screenTopology.subscribeResolution(listener) : () => {},
		[isRelative],
	);
	const getSnapshot = useCallback(
		() =>
			typeof target === "string"
				? target
				: isRelative
					? screenTopology.resolve(screenKey, depth ?? 0)
					: screenKey,
		[depth, isRelative, screenKey, target],
	);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
