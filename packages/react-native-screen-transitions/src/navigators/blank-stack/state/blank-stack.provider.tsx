import { type ReactNode, useMemo } from "react";
import type { BlankStackDescriptor } from "../../../types/blank-stack.types";
import type {
	BlankStackProviderProps,
	BlankStackStoreValue,
} from "../../../types/providers/blank-stack-provider.types";
import type { BaseStackScene } from "../../../types/stack.types";
import createProvider from "../../../utils/create-provider";
import {
	cancelScreenBoundsCleanup,
	resetStoresForScreen,
} from "../components/lifecycle/hooks/helpers/reset-stores-for-screen";
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
	useOptionalBlankStackStore,
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
		const routeLifetimeKeys = useMemo(
			() =>
				stackState.preloadedRoutes?.length
					? state.routeKeys.concat(
							stackState.preloadedRoutes.map(({ key }) => key),
						)
					: state.routeKeys,
			[state.routeKeys, stackState.preloadedRoutes],
		);
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

		return {
			value: {
				navigatorKey,
				routeKeys: state.routeKeys,
				routeLifetimeKeys,
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
			children,
		};
	},
	{
		getRouteKeys: (store) => store.routeLifetimeKeys ?? store.routeKeys,
		onRouteAdded: cancelScreenBoundsCleanup,
		onRouteRemoved: resetStoresForScreen,
	},
);

export type { BlankStackProviderProps, BlankStackStoreValue };
export {
	BlankStackProvider,
	BlankStackStoreProvider,
	useBlankStackStore,
	useOptionalBlankStackStore,
};
