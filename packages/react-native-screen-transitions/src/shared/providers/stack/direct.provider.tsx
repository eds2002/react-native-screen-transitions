import type {
	ParamListBase,
	RouteProp,
	StackNavigationState,
} from "@react-navigation/native";
import * as React from "react";
import { useMemo } from "react";
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
import { AnimationStore } from "../../stores/animation.store";
import { useStackCoreContext } from "./core.provider";

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
	} = useMemo(() => {
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
					options?.overlayMode === "float" &&
					options?.overlayShown === true
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
		};
	}, [state.routes, state.preloadedRoutes, descriptors, preloadedDescriptors]);

	// Get animation store maps for all routes
	const animationMaps = useMemo(
		() => allRoutes.map((route) => AnimationStore.getAll(route.key)),
		[allRoutes],
	);

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
		const currentIndex = animationMaps.length - 1;
		let isAnyClosing = false;
		for (let i = 0; i < animationMaps.length; i++) {
			if (animationMaps[i].closing.value > 0) {
				isAnyClosing = true;
				break;
			}
		}
		return currentIndex - (isAnyClosing ? 1 : 0);
	});

	const focusedIndex = state.index;

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
		}),
		[
			routeKeys,
			allRoutes,
			allDescriptors,
			scenes,
			focusedIndex,
			stackProgress,
			optimisticFocusedIndex,
			flags,
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
