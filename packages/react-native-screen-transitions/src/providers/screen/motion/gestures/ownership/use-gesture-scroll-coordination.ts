import { useCallback, useSyncExternalStore } from "react";
import type { ScrollGestureAxis } from "../types";
import { gestureOwnershipCoordinator } from "./gesture-ownership-coordinator";

export const useGestureScrollCoordination = (
	screenKey: string | null,
	axis: ScrollGestureAxis,
) => {
	const subscribe = useCallback(
		(listener: () => void) =>
			screenKey
				? gestureOwnershipCoordinator.subscribe(screenKey, listener)
				: () => {},
		[screenKey],
	);
	const getSnapshot = useCallback(
		() =>
			gestureOwnershipCoordinator.getScrollCoordination(screenKey ?? "", axis),
		[axis, screenKey],
	);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
