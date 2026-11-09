import { useCallback, useMemo, useSyncExternalStore } from "react";
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

/**
 * The screens a screen is drawn inside, nearest first: a nested stack's screens are drawn in their
 * stack's screen in the stack above. Follows the screen's parent as it registers or changes.
 */
export const useAncestorScreenKeys = (screenKey: string): string[] => {
	const subscribe = useCallback(
		(listener: () => void) => screenTopology.subscribe(screenKey, listener),
		[screenKey],
	);
	const getParent = useCallback(
		() => screenTopology.getRelationships(screenKey).parentScreenKey,
		[screenKey],
	);
	const parentScreenKey = useSyncExternalStore(subscribe, getParent, getParent);
	return useMemo(() => {
		const out: string[] = [];
		let key: string | null | undefined = parentScreenKey;
		while (key && !out.includes(key)) {
			out.push(key);
			key = screenTopology.getRelationships(key).parentScreenKey;
		}
		return out;
	}, [parentScreenKey]);
};
