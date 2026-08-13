import { useCallback, useSyncExternalStore } from "react";
import { screenTopology } from "./create-screen-topology";

export const useScreenRelationships = (screenKey: string) => {
	const subscribe = useCallback(
		(listener: () => void) => screenTopology.subscribe(screenKey, listener),
		[screenKey],
	);
	const getSnapshot = useCallback(
		() => screenTopology.getRelationships(screenKey),
		[screenKey],
	);

	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
