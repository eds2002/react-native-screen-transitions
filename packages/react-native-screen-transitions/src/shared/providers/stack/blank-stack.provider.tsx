import type { Route } from "@react-navigation/native";
import { type ReactNode, useMemo } from "react";
import {
	type StackContextValue,
	StackProvider,
} from "../../hooks/navigation/use-stack";
import type {
	BlankStackProviderProps,
	BlankStackStoreValue,
} from "../../types/providers/blank-stack-provider.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackScene,
} from "../../types/stack.types";
import createProvider from "../../utils/create-provider";
import { useBlankStackState } from "./blank-stack-state";
import { resolvePresentedIndex } from "./blank-stack-state/helpers/resolve-presented-index";
import { useStackCoreStore } from "./core.provider";

type InternalBlankStackProviderProps = BlankStackProviderProps<
	BaseStackDescriptor,
	BaseStackNavigation
> & {
	children: ReactNode;
};

const createScenesByKey = <TDescriptor extends BaseStackDescriptor>(
	scenes: BaseStackScene<TDescriptor>[],
) => {
	const scenesByKey: Record<string, BaseStackScene<TDescriptor>> = {};

	for (const scene of scenes) {
		scenesByKey[scene.route.key] = scene;
	}

	return scenesByKey;
};

type BlankStackStoreProviderProps = {
	children: ReactNode;
	value: BlankStackStoreValue<BaseStackDescriptor>;
};

const { BlankStackProvider: BlankStackStoreProvider, useBlankStackStore } =
	createProvider("BlankStack", { guarded: false })<
		BlankStackStoreProviderProps,
		BlankStackStoreValue<BaseStackDescriptor>
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

	const stackValue = useMemo<StackContextValue>(
		() => ({
			flags,
			navigatorKey,
			routeKeys: state.routeKeys,
			routes: state.routes as Route<string>[],
			scenes: state.scenes as BaseStackScene[],
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
export { BlankStackProvider, useBlankStackStore };
