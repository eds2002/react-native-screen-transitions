import { type ReactNode, useMemo } from "react";
import {
	type StackContextValue,
	StackProvider,
} from "../../hooks/navigation/use-stack";
import type {
	DirectStackContextValue,
	DirectStackDescriptorMap,
	DirectStackProps,
	DirectStackScene,
} from "../../types/providers/direct-stack.types";
import createProvider from "../../utils/create-provider";
import { isOverlayVisible } from "../../utils/overlay/visibility";
import { useStackCoreStore } from "./core.provider";

type DirectStackProviderProps = DirectStackProps & {
	children: ReactNode;
};

type DirectStackStoreProviderProps = {
	children: ReactNode;
	value: DirectStackContextValue;
};

const { DirectStackProvider: DirectStackStoreProvider, useDirectStackStore } =
	createProvider("DirectStack", { guarded: true })<
		DirectStackStoreProviderProps,
		DirectStackContextValue
	>(({ children, value }) => ({ children, value }));

function DirectStackProvider({
	state,
	navigation,
	descriptors,
	describe,
	children,
}: DirectStackProviderProps) {
	const flags = useStackCoreStore((store) => store.flags);
	const navigatorKey = state.key;
	const preloadedDescriptors = useMemo(() => {
		return state.preloadedRoutes.reduce<DirectStackDescriptorMap>(
			(acc, route) => {
				acc[route.key] = acc[route.key] || describe(route, true);
				return acc;
			},
			{},
		);
	}, [state.preloadedRoutes, describe]);

	const { scenes, shouldShowFloatOverlay, routeKeys, allRoutes } =
		useMemo(() => {
			const allRoutes = state.routes.concat(state.preloadedRoutes);
			const scenes: DirectStackScene[] = [];
			const routeKeys: string[] = [];
			const allDescriptors: DirectStackDescriptorMap = {
				...preloadedDescriptors,
				...descriptors,
			};
			let shouldShowFloatOverlay = false;

			for (let index = 0; index < allRoutes.length; index++) {
				const route = allRoutes[index];
				if (!route) {
					throw new Error(`Missing stack route at index ${index}.`);
				}
				const descriptor = allDescriptors[route.key];

				if (!descriptor) {
					throw new Error(`Missing descriptor for route "${route.key}".`);
				}

				const isPreloaded =
					preloadedDescriptors[route.key] !== undefined &&
					descriptors[route.key] === undefined;

				scenes.push({
					activity:
						index === state.index
							? "active"
							: index === state.index - 1
								? "inert"
								: "inactive",
					route,
					descriptor,
					isPreloaded,
				});
				routeKeys.push(route.key);

				if (
					!shouldShowFloatOverlay &&
					descriptor.options?.enableTransitions === true &&
					isOverlayVisible(descriptor.options)
				) {
					shouldShowFloatOverlay = true;
				}
			}

			return {
				scenes,
				shouldShowFloatOverlay,
				routeKeys,
				allRoutes,
			};
		}, [
			state.routes,
			state.preloadedRoutes,
			state.index,
			preloadedDescriptors,
			descriptors,
		]);

	const focusedIndex = state.index;
	const stackValue = useMemo<StackContextValue>(
		() => ({
			flags,
			navigatorKey,
			routeKeys,
			routes: allRoutes,
			scenes,
			focusedIndex,
		}),
		[flags, navigatorKey, routeKeys, allRoutes, scenes, focusedIndex],
	);
	const directStackValue = {
		state,
		navigation,
		descriptors,
		scenes,
		focusedIndex,
		shouldShowFloatOverlay,
	};

	return (
		<StackProvider value={stackValue}>
			<DirectStackStoreProvider value={directStackValue}>
				{children}
			</DirectStackStoreProvider>
		</StackProvider>
	);
}

export type {
	DirectStackContextValue,
	DirectStackProps,
	DirectStackProviderProps,
	DirectStackScene,
};
export { DirectStackProvider, useDirectStackStore };
