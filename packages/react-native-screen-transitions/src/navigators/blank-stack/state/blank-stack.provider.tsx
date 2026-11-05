import { type ReactNode, useMemo } from "react";
import {
	ScreenHostStoreProvider,
	type ScreenHostValue,
} from "../../../providers/host/screen-host.provider";
import type { BlankStackDescriptor } from "../../../types/blank-stack.types";
import type {
	BlankStackProviderProps,
	BlankStackStoreValue,
} from "../../../types/providers/blank-stack-provider.types";
import type { BaseStackScene } from "../../../types/stack.types";
import createProvider from "../../../utils/create-provider";
import { resolvePresentedIndex } from "./helpers/resolve-presented-index";
import { useBlankStackState } from "./use-blank-stack-state";

type InternalBlankStackProviderProps = BlankStackProviderProps & {
	children: ReactNode;
};

const createScenesByKey = (scenes: BaseStackScene<BlankStackDescriptor>[]) => {
	const scenesByKey: Record<string, BaseStackScene<BlankStackDescriptor>> = {};

	for (const scene of scenes) {
		scenesByKey[scene.route.key] = scene;
	}

	return scenesByKey;
};

const {
	StoreProvider: BlankStackStoreProvider,
	BlankStackProvider,
	useBlankStackStore,
} = createProvider("BlankStack")<
	InternalBlankStackProviderProps,
	BlankStackStoreValue
>(
	({ state: stackState, children, ...props }) => {
		const { state, handleCloseRoute, handleOpenRoute, requestDismiss } =
			useBlankStackState({
				...props,
				state: stackState,
			});

		const navigatorKey = stackState.key;
		const focusedIndex = resolvePresentedIndex(
			state.routes,
			state.focusedRouteKey,
			state.closingRouteKeys,
		);

		const scenesByKey = useMemo(
			() => createScenesByKey(state.scenes),
			[state.scenes],
		);

		const paintDriverRouteKeyByRouteKey = useMemo(() => {
			const paintDrivers = new Map<string, string>();

			for (let index = 0; index + 2 < state.routeKeys.length; index++) {
				paintDrivers.set(state.routeKeys[index], state.routeKeys[index + 2]);
			}

			return paintDrivers;
		}, [state.routeKeys]);

		const hostValue: ScreenHostValue = {
			navigatorKey,
			routeKeys: state.routeKeys,
			scenes: state.scenes,
			scenesByKey,
			focusedIndex,
			firstRouteKey: stackState.routes[0]?.key,
		};

		return {
			value: {
				navigatorKey,
				routeKeys: state.routeKeys,
				routes: state.routes,
				scenes: state.scenes,
				scenesByKey,
				paintDriverRouteKeyByRouteKey,
				focusedIndex,
				requestDismiss,
				shouldShowFloatOverlay: state.shouldShowFloatOverlay,
				handleCloseRoute,
				handleOpenRoute,
			},
			// The engine reads its screens from the host, never from this store.
			children: (
				<ScreenHostStoreProvider value={hostValue}>
					{children}
				</ScreenHostStoreProvider>
			),
		};
	},
	{ getRouteActivity: (store, key) => store.scenesByKey[key]?.activity },
);

export type { BlankStackProviderProps, BlankStackStoreValue };
export { BlankStackProvider, BlankStackStoreProvider, useBlankStackStore };
