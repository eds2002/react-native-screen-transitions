import { useLayoutEffect } from "react";
import { screenTopology } from "../topology/helpers/create-screen-topology";
import type { ScreenTopologyRegistration } from "../topology/types";

export function useScreenTopology({
	screenKey,
	navigatorKey,
	parentScreenKey,
	transitionKey,
	isActiveScreen,
}: ScreenTopologyRegistration & { isActiveScreen: boolean }) {
	useLayoutEffect(() => {
		screenTopology.register({
			screenKey,
			navigatorKey,
			parentScreenKey,
			transitionKey,
		});
	}, [screenKey, navigatorKey, parentScreenKey, transitionKey]);

	useLayoutEffect(() => {
		if (!isActiveScreen || !parentScreenKey) return;

		screenTopology.activate({
			screenKey,
			parentScreenKey,
		});
	}, [isActiveScreen, parentScreenKey, screenKey]);

	useLayoutEffect(
		() => () => {
			screenTopology.unregister(screenKey);
		},
		[screenKey],
	);
}
