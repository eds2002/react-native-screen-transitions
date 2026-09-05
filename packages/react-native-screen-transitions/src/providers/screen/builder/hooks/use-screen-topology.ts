import { useLayoutEffect } from "react";
import { useOptionalBlankStackStore } from "../../../stack/blank-stack.provider";
import { useOptionalBuilderStore } from "../builder.provider";
import { screenTopology } from "../topology/helpers/create-screen-topology";

export function useScreenTopology(screenKey: string) {
	const parentScreenKey = useOptionalBuilderStore(
		(store) => store?.derivations.currentScreenKey,
	);

	const transitionKey = useOptionalBlankStackStore(
		(store) => store?.scenesByKey[screenKey]?.descriptor.options.transitionKey,
	);

	const navigatorKey = useOptionalBlankStackStore((store) =>
		store?.scenesByKey[screenKey] ? store.navigatorKey : undefined,
	);

	const isActiveScreen = useOptionalBlankStackStore((store) => {
		const focusedScene = store?.scenes[store.focusedIndex];
		return (
			focusedScene?.route.key === screenKey &&
			focusedScene.activity === "active"
		);
	});

	const enabled = navigatorKey !== undefined;

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
