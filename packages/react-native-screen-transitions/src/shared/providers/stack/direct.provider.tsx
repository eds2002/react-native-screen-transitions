import type * as React from "react";
import { useMemo } from "react";
import type { NativeStackDescriptorMap } from "../../../native-stack/types";
import {
	type StackContextValue,
	StackProvider,
} from "../../hooks/navigation/use-stack";
import type {
	DirectStackContextValue,
	DirectStackProps,
	DirectStackScene,
} from "../../types/providers/direct-stack.types";
import { isOverlayVisible } from "../../utils/overlay/visibility";
import { useStackCoreContext } from "./core.provider";

function useDirectStackValue(
	props: DirectStackProps,
): DirectStackContextValue & { stackContextValue: StackContextValue } {
	const { state, navigation, descriptors, describe } = props;
	const { flags } = useStackCoreContext();
	const navigatorKey = state.key;

	const preloadedDescriptors = useMemo(() => {
		return state.preloadedRoutes.reduce<NativeStackDescriptorMap>(
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
			const allDescriptors: NativeStackDescriptorMap = {
				...preloadedDescriptors,
				...descriptors,
			};
			let shouldShowFloatOverlay = false;

			for (const route of allRoutes) {
				const descriptor = allDescriptors[route.key];
				const isPreloaded =
					preloadedDescriptors[route.key] !== undefined &&
					descriptors[route.key] === undefined;

				scenes.push({ route, descriptor, isPreloaded });
				routeKeys.push(route.key);

				if (!shouldShowFloatOverlay && descriptor) {
					const options = descriptor.options;
					if (
						options?.enableTransitions === true &&
						isOverlayVisible(options)
					) {
						shouldShowFloatOverlay = true;
					}
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
			preloadedDescriptors,
			descriptors,
		]);

	const focusedIndex = state.index;

	const stackContextValue = useMemo<StackContextValue>(
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

	// DirectStack context value
	const lifecycleValue = useMemo<DirectStackContextValue>(
		() => ({
			state,
			navigation,
			descriptors,
			scenes,
			focusedIndex,
			shouldShowFloatOverlay,
		}),
		[
			state,
			navigation,
			descriptors,
			scenes,
			focusedIndex,
			shouldShowFloatOverlay,
		],
	);

	return { ...lifecycleValue, stackContextValue };
}

function withDirectStack<TProps extends DirectStackProps>(
	Component: React.ComponentType<DirectStackContextValue>,
): React.FC<TProps> {
	return function DirectStackProvider(props: TProps) {
		const { stackContextValue, ...lifecycleValue } = useDirectStackValue(props);

		return (
			<StackProvider value={stackContextValue}>
				<Component {...lifecycleValue} />
			</StackProvider>
		);
	};
}

export type { DirectStackContextValue, DirectStackProps, DirectStackScene };
export { withDirectStack };
