import { type ReactNode, useMemo } from "react";
import type { BlankStackDescriptor } from "../../types/blank-stack.types";
import type {
	BlankStackProviderProps,
	BlankStackStoreValue,
} from "../../types/providers/blank-stack-provider.types";
import type { BaseStackScene } from "../../types/stack.types";
import createProvider from "../../utils/create-provider";
import { useBlankStackState } from "./blank-stack-state";
import { resolvePresentedIndex } from "./blank-stack-state/helpers/resolve-presented-index";

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
>(({ state: stackState, children, ...props }) => {
	const { state, handleCloseRoute, requestDismiss } = useBlankStackState({
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
		},
		children,
	};
});

export type { BlankStackProviderProps, BlankStackStoreValue };
export {
	BlankStackProvider,
	BlankStackStoreProvider,
	useBlankStackStore,
	useOptionalBlankStackStore,
};
