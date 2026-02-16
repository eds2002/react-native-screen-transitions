import type {
	ParamListBase,
	RouteProp,
	StackNavigationState,
} from "@react-navigation/native";
import * as React from "react";
import { useEffect, useMemo } from "react";
import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type {
	NativeStackDescriptor,
	NativeStackDescriptorMap,
	NativeStackNavigationHelpers,
} from "../../../native-stack/types";
import {
	StackContext,
	type StackContextValue,
} from "../../hooks/navigation/use-stack";
import {
	AnimationStore,
	type AnimationStoreMap,
} from "../../stores/animation.store";
import { HistoryStore } from "../../stores/history.store";
import { isFloatOverlayVisible } from "../../utils/overlay/visibility";
import { useStackCoreContext } from "./core.provider";
import { useVisuallyClosingRouteMap } from "./helpers/use-visually-closing-route-map";

export interface DirectStackScene {
	route: StackNavigationState<ParamListBase>["routes"][number];
	descriptor: NativeStackDescriptor;
	isPreloaded: boolean;
}

export interface DirectStackProps {
	state: StackNavigationState<ParamListBase>;
	navigation: NativeStackNavigationHelpers;
	descriptors: NativeStackDescriptorMap;
	describe: (
		route: RouteProp<ParamListBase>,
		placeholder: boolean,
	) => NativeStackDescriptor;
}

export interface DirectStackContextValue {
	state: StackNavigationState<ParamListBase>;
	navigation: NativeStackNavigationHelpers;
	descriptors: NativeStackDescriptorMap;
	preloadedDescriptors: NativeStackDescriptorMap;
	scenes: DirectStackScene[];
	focusedIndex: number;
	shouldShowFloatOverlay: boolean;
	stackProgress: DerivedValue<number>;
	optimisticFocusedIndex: DerivedValue<number>;
	visuallyClosingRouteMap: Readonly<Record<string, true>>;
}

const DirectStackContext = React.createContext<DirectStackContextValue | null>(
	null,
);
DirectStackContext.displayName = "DirectStack";

function useDirectStackContext(): DirectStackContextValue {
	const context = React.useContext(DirectStackContext);
	if (!context) {
		throw new Error(
			"useDirectStackContext must be used within DirectStackProvider",
		);
	}
	return context;
}

/**
 * Internal hook that computes all lifecycle values.
 */
function useDirectStackValue(
	props: DirectStackProps,
): DirectStackContextValue & { stackContextValue: StackContextValue } {
	const { state, navigation, descriptors, describe } = props;
	const { flags } = useStackCoreContext();

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
		allDescriptors,
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
			animationMaps.push(AnimationStore.getAll(route.key));

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
			allDescriptors,
			animationMaps,
		};
	}, [state.routes, state.preloadedRoutes, preloadedDescriptors, descriptors]);

	const stackProgress = useDerivedValue(() => {
		"worklet";
		let total = 0;
		for (let i = 0; i < animationMaps.length; i++) {
			total += animationMaps[i].progress.value;
		}
		return total;
	});

	const optimisticFocusedIndex = useDerivedValue(() => {
		"worklet";
		const lastIndex = animationMaps.length - 1;
		let closingFromTop = 0;
		for (let i = lastIndex; i >= 0; i--) {
			if (animationMaps[i].closing.value > 0) closingFromTop++;
			else break;
		}
		return lastIndex - closingFromTop;
	});

	const focusedIndex = state.index;

	const visuallyClosingRouteMap = useVisuallyClosingRouteMap(
		routeKeys,
		animationMaps,
	);

	const stackContextValue = useMemo<StackContextValue>(
		() => ({
			flags,
			routeKeys,
			routes: allRoutes,
			descriptors: allDescriptors,
			scenes,
			focusedIndex,
			stackProgress,
			optimisticFocusedIndex,
			visuallyClosingRouteMap,
		}),
		[
			routeKeys,
			allRoutes,
			scenes,
			focusedIndex,
			stackProgress,
			optimisticFocusedIndex,
			visuallyClosingRouteMap,
			flags,
			allDescriptors,
		],
	);

	// DirectStack context value
	const lifecycleValue = useMemo<DirectStackContextValue>(
		() => ({
			state,
			navigation,
			descriptors,
			preloadedDescriptors,
			scenes,
			focusedIndex,
			shouldShowFloatOverlay,
			stackProgress,
			optimisticFocusedIndex,
			visuallyClosingRouteMap,
		}),
		[
			state,
			navigation,
			descriptors,
			preloadedDescriptors,
			scenes,
			focusedIndex,
			shouldShowFloatOverlay,
			stackProgress,
			optimisticFocusedIndex,
			visuallyClosingRouteMap,
		],
	);

	return { ...lifecycleValue, stackContextValue };
}

/**
 * HOC that wraps component with DirectStack provider AND StackContext.
 * Used by native-stack which uses navigation state directly (no local route management).
 */
function withDirectStack<TProps extends DirectStackProps>(
	Component: React.ComponentType<DirectStackContextValue>,
): React.FC<TProps> {
	return function DirectStackProvider(props: TProps) {
		const navigatorKey = props.state.key;

		// Clean up history when navigator unmounts
		useEffect(() => {
			return () => {
				HistoryStore.clearNavigator(navigatorKey);
			};
		}, [navigatorKey]);

		const { stackContextValue, ...lifecycleValue } = useDirectStackValue(props);

		return (
			<StackContext.Provider value={stackContextValue}>
				<DirectStackContext.Provider value={lifecycleValue}>
					<Component {...lifecycleValue} />
				</DirectStackContext.Provider>
			</StackContext.Provider>
		);
	};
}

export { useDirectStackContext, withDirectStack };
