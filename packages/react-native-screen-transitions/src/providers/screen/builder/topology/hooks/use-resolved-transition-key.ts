import { useCallback, useSyncExternalStore } from "react";
import type { ScreenTransitionTarget } from "../../../../../types/animation.types";
import { screenTopology } from "../helpers/create-screen-topology";

export const useResolvedTransitionKey = (
	screenKey: string | null,
	target?: ScreenTransitionTarget,
) => {
	const depth = typeof target === "string" ? null : (target?.depth ?? 0);
	const requiresResolution = typeof target === "string" || depth !== 0;
	const subscribe = useCallback(
		(listener: () => void) =>
			requiresResolution
				? screenTopology.subscribeResolution(listener)
				: () => {},
		[requiresResolution],
	);
	const getSnapshot = useCallback(
		() =>
			typeof target === "string"
				? screenTopology.resolveTransitionKey(target)
				: requiresResolution && screenKey
					? screenTopology.resolve(screenKey, depth ?? 0)
					: screenKey,
		[depth, requiresResolution, screenKey, target],
	);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
