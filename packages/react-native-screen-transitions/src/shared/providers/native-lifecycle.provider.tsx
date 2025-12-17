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
} from "../../native-stack/types";
import { StackContext, type StackContextValue } from "../hooks/use-stack";
import { AnimationStore } from "../stores/animation.store";

export interface NativeStackScene {
	route: StackNavigationState<ParamListBase>["routes"][number];
	descriptor: NativeStackDescriptor;
	isPreloaded: boolean;
}

export interface NativeLifecycleProps {
	state: StackNavigationState<ParamListBase>;
	navigation: NativeStackNavigationHelpers;
	descriptors: NativeStackDescriptorMap;
	describe: (
		route: RouteProp<ParamListBase>,
		placeholder: boolean,
	) => NativeStackDescriptor;
}

export interface NativeLifecycleContextValue {
	state: StackNavigationState<ParamListBase>;
	navigation: NativeStackNavigationHelpers;
	descriptors: NativeStackDescriptorMap;
	preloadedDescriptors: NativeStackDescriptorMap;
	scenes: NativeStackScene[];
	focusedIndex: number;
	shouldShowFloatOverlay: boolean;
	stackProgress: DerivedValue<number>;
	optimisticFocusedIndex: DerivedValue<number>;
}

const NativeLifecycleContext =
	React.createContext<NativeLifecycleContextValue | null>(null);
NativeLifecycleContext.displayName = "NativeLifecycle";

function useNativeLifecycleContext(): NativeLifecycleContextValue {
	const context = React.useContext(NativeLifecycleContext);
	if (!context) {
		throw new Error(
			"useNativeLifecycleContext must be used within NativeLifecycleProvider",
		);
	}
	return context;
}

/**
 * Internal hook that computes all lifecycle values.
 */
function useNativeLifecycleValue(
	props: NativeLifecycleProps,
): NativeLifecycleContextValue & { stackContextValue: StackContextValue } {
	const { state, navigation, descriptors, describe } = props;

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
		const scenes: NativeStackScene[] = [];
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
			flags: { TRANSITIONS_ALWAYS_ON: false },
			routeKeys,
			routes: allRoutes,
			descriptors: allDescriptors,
			focusedIndex,
			stackProgress,
			optimisticFocusedIndex,
		}),
		[
			routeKeys,
			allRoutes,
			allDescriptors,
			focusedIndex,
			stackProgress,
			optimisticFocusedIndex,
		],
	);

	// NativeLifecycle context value
	const lifecycleValue = useMemo<NativeLifecycleContextValue>(
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
 * HOC that wraps component with NativeLifecycle provider AND StackContext.
 */
function withNativeLifecycle<TProps extends NativeLifecycleProps>(
	Component: React.ComponentType<NativeLifecycleContextValue>,
): React.FC<TProps> {
	return function NativeLifecycleProvider(props: TProps) {
		const { stackContextValue, ...lifecycleValue } =
			useNativeLifecycleValue(props);

		return (
			<StackContext.Provider value={stackContextValue}>
				<NativeLifecycleContext.Provider value={lifecycleValue}>
					<Component {...lifecycleValue} />
				</NativeLifecycleContext.Provider>
			</StackContext.Provider>
		);
	};
}

export { useNativeLifecycleContext, withNativeLifecycle };
