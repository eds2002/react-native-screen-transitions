import type * as React from "react";
import { useMemo } from "react";
import type { NativeStackDescriptorMap } from "../../../native-stack/types";
import {
	StackContext,
	type StackContextValue,
} from "../../hooks/navigation/use-stack";
import {
	AnimationStore,
	type AnimationStoreMap,
} from "../../stores/animation.store";
import type {
	DirectStackContextValue,
	DirectStackProps,
	DirectStackScene,
} from "../../types/providers/direct-stack.types";
import { isFloatOverlayVisible } from "../../utils/overlay/visibility";
import { useStackCoreContext } from "./core.provider";
import { useStackDerived } from "./helpers/use-stack-derived";

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

	const {
		scenes,
		shouldShowFloatOverlay,
		routeKeys,
		allRoutes,
		animationMaps,
	} = useMemo(() => {
		const allRoutes = state.routes.concat(state.preloadedRoutes);
		const scenes: DirectStackScene[] = [];
		const routeKeys: string[] = [];
		const animationMaps: AnimationStoreMap[] = [];
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
			animationMaps.push(AnimationStore.getRouteAnimations(route.key));

			if (!shouldShowFloatOverlay && descriptor) {
				const options = descriptor.options;
				if (
					options?.enableTransitions === true &&
					isFloatOverlayVisible(options)
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
			animationMaps,
		};
	}, [state.routes, state.preloadedRoutes, preloadedDescriptors, descriptors]);

	const { stackProgress, optimisticFocusedIndex } =
		useStackDerived(animationMaps);

	const focusedIndex = state.index;

	const stackContextValue = useMemo<StackContextValue>(
		() => ({
			flags,
			navigatorKey,
			routeKeys,
			routes: allRoutes,
			scenes,
			stackProgress,
			optimisticFocusedIndex,
		}),
		[
			flags,
			navigatorKey,
			routeKeys,
			allRoutes,
			scenes,
			stackProgress,
			optimisticFocusedIndex,
		],
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
			<StackContext.Provider value={stackContextValue}>
				<Component {...lifecycleValue} />
			</StackContext.Provider>
		);
	};
}

export { withDirectStack };
export type { DirectStackContextValue, DirectStackProps, DirectStackScene };
