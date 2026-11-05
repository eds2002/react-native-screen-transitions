import { useLayoutEffect } from "react";
import { useOptionalScreenHostStore } from "../../host/screen-host.provider";
import { useOptionalBuilderStore } from "../builder.provider";
import { screenTopology } from "../topology/helpers/create-screen-topology";

/**
 * Registers a screen so relative (`{ depth }`) and named (`transitionKey`) lookups can find it.
 * A host's screens always register. A screen outside any host (a standalone motion unit)
 * registers only when it has a `transitionKey` to be found by.
 */
export function useScreenTopology(
	screenKey: string,
	ownTransitionKey: string | undefined,
) {
	const parentScreenKey = useOptionalBuilderStore(
		(store) => store?.derivations.currentScreenKey,
	);

	const hostTransitionKey = useOptionalScreenHostStore(
		(store) => store?.scenesByKey[screenKey]?.descriptor.options.transitionKey,
	);

	const hostNavigatorKey = useOptionalScreenHostStore((store) =>
		store?.scenesByKey[screenKey] ? store.navigatorKey : undefined,
	);

	const inHost = hostNavigatorKey !== undefined;
	const transitionKey = inHost ? hostTransitionKey : ownTransitionKey;
	const navigatorKey = inHost ? hostNavigatorKey : undefined;

	const isActiveScreen = useOptionalScreenHostStore((store) => {
		const focusedScene = store?.scenes[store.focusedIndex];
		return (
			focusedScene?.route.key === screenKey &&
			focusedScene.activity === "active"
		);
	});

	const enabled = inHost || ownTransitionKey !== undefined;

	useLayoutEffect(() => {
		if (!enabled) return;
		screenTopology.register({
			screenKey,
			navigatorKey,
			parentScreenKey,
			transitionKey,
		});
	}, [enabled, screenKey, navigatorKey, parentScreenKey, transitionKey]);

	useLayoutEffect(() => {
		if (!enabled || !isActiveScreen || !parentScreenKey) return;

		screenTopology.activate({
			screenKey,
			parentScreenKey,
		});
	}, [enabled, isActiveScreen, parentScreenKey, screenKey]);

	useLayoutEffect(() => {
		if (!enabled) return;
		return () => screenTopology.unregister(screenKey);
	}, [enabled, screenKey]);
}
