import { type ReactNode, useLayoutEffect, useMemo } from "react";
import type { ScreenTransitionSource } from "../../../types/bounds.types";
import { createBoundsAccessor } from "../../../utils/bounds";
import createProvider from "../../../utils/create-provider";
import { useBlankStackStore } from "../../stack/blank-stack.provider";
import { useScreenAnimationStore } from "../animation/animation.provider";
import { useDescriptorsStore } from "../descriptors";
import { screenTopology } from "./helpers/create-screen-topology";

type Props = {
	children: ReactNode;
};

type ScreenTopologyContextValue = {
	screenKey: string;
};

const {
	ScreenTopologyProvider,
	useOptionalScreenTopologyStore,
	useScreenTopologyStore,
} = createProvider("ScreenTopology")<Props, ScreenTopologyContextValue>(
	({ children }) => {
		const screenKey = useDescriptorsStore(
			(store) => store.derivations.currentScreenKey,
		);
		const transitionKey = useDescriptorsStore(
			(store) => store.options.transitionKey,
		);
		const parentScreenKey = useOptionalScreenTopologyStore(
			(store) => store?.screenKey,
		);
		const navigatorKey = useBlankStackStore((store) => store.navigatorKey);
		const isActiveScreen = useBlankStackStore((store) => {
			const focusedScene = store.scenes[store.focusedIndex];
			return (
				focusedScene?.route.key === screenKey &&
				focusedScene.activity === "active"
			);
		});
		const screenInterpolatorProps = useScreenAnimationStore(
			(store) => store.screenInterpolatorProps,
		);

		const transitionSource = useMemo<ScreenTransitionSource>(
			() => ({
				screenInterpolatorProps,
				boundsAccessor: createBoundsAccessor(() => {
					"worklet";
					return screenInterpolatorProps.get();
				}),
			}),
			[screenInterpolatorProps],
		);

		useLayoutEffect(() => {
			screenTopology.register({
				screenKey,
				navigatorKey,
				parentScreenKey,
				transitionKey,
			});
		}, [screenKey, navigatorKey, parentScreenKey, transitionKey]);

		useLayoutEffect(() => {
			screenTopology.registerTransitionSource(screenKey, transitionSource);

			return () => {
				screenTopology.unregisterTransitionSource(screenKey);
			};
		}, [screenKey, transitionSource]);

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

		const value = useMemo(() => ({ screenKey }), [screenKey]);

		return {
			value,
			children,
		};
	},
);

export { ScreenTopologyProvider, useScreenTopologyStore };
