import type { Route } from "@react-navigation/native";
import { type ReactNode, useMemo } from "react";
import {
	type StackContextValue,
	StackProvider,
} from "../../hooks/navigation/use-stack";
import type { BlankStackDescriptor } from "../../types/blank-stack.types";
import type {
	BlankStackProviderProps,
	BlankStackStoreValue,
} from "../../types/providers/blank-stack-provider.types";
import type { BaseStackScene } from "../../types/stack.types";
import createProvider from "../../utils/create-provider";
import { useBlankStackState } from "./blank-stack-state";
import { resolvePresentedIndex } from "./blank-stack-state/helpers/resolve-presented-index";
import { useStackCoreStore } from "./core.provider";

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

type BlankStackStoreProviderProps = {
	children: ReactNode;
	value: BlankStackStoreValue;
};

const {
	BlankStackProvider: BlankStackStoreProvider,
	useBlankStackStore,
	useOptionalBlankStackStore,
} = createProvider("BlankStack")<
	BlankStackStoreProviderProps,
	BlankStackStoreValue
>(({ children, value }) => ({ children, value }));

function BlankStackProvider({
	state: stackState,
	children,
	...props
}: InternalBlankStackProviderProps) {
	const flags = useStackCoreStore((store) => store.flags);
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

	const stackValue = useMemo<StackContextValue>(
		() => ({
			flags,
			navigatorKey,
			routeKeys: state.routeKeys,
			routes: state.routes as Route<string>[],
			scenes: state.scenes,
			focusedIndex,
			requestDismiss,
		}),
		[
			flags,
			navigatorKey,
			state.routeKeys,
			state.routes,
			state.scenes,
			focusedIndex,
			requestDismiss,
		],
	);
	const blankStackValue = {
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
	};

	return (
		<StackProvider value={stackValue}>
			<BlankStackStoreProvider value={blankStackValue}>
				{children}
			</BlankStackStoreProvider>
		</StackProvider>
	);
}

export type { BlankStackProviderProps, BlankStackStoreValue };
export { BlankStackProvider, useBlankStackStore, useOptionalBlankStackStore };
