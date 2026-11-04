import { useCallback, useSyncExternalStore } from "react";
import { useBuilderStore } from "../..";
import { screenTopology } from "../helpers/create-screen-topology";

export const useScreenRelationships = (routeKey?: string) => {
	const currentScreenKey = useBuilderStore(
		(store) => store.derivations.currentScreenKey,
	);
	const screenKey = routeKey ?? currentScreenKey;

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
