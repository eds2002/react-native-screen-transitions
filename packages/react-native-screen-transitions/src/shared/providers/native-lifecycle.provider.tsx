import type {
	ParamListBase,
	RouteProp,
	StackNavigationState,
} from "@react-navigation/native";
import type * as React from "react";
import { useMemo } from "react";
import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type {
	NativeStackDescriptor,
	NativeStackDescriptorMap,
	NativeStackNavigationHelpers,
} from "../../native-stack/types";
import { StackContext } from "../hooks/use-stack";
import { AnimationStore } from "../stores/animation.store";
import createProvider from "../utils/create-provider";

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

const { withNativeLifecycleProvider, useNativeLifecycleContext } =
	createProvider("NativeLifecycle")<
		NativeLifecycleProps,
		NativeLifecycleContextValue
	>((props) => {
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

		const allRoutes = useMemo(
			() => state.routes.concat(state.preloadedRoutes),
			[state.routes, state.preloadedRoutes],
		);

		const { scenes, shouldShowFloatOverlay } = useMemo(() => {
			const scenes: NativeStackScene[] = [];
			let shouldShowFloatOverlay = false;

			for (const route of allRoutes) {
				const descriptor =
					descriptors[route.key] ?? preloadedDescriptors[route.key];
				const isPreloaded =
					preloadedDescriptors[route.key] !== undefined &&
					descriptors[route.key] === undefined;

				scenes.push({ route, descriptor, isPreloaded });

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

			return { scenes, shouldShowFloatOverlay };
		}, [allRoutes, descriptors, preloadedDescriptors]);

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
		}, [animationMaps]);

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
		}, [animationMaps]);

		const value = useMemo(
			() => ({
				state,
				navigation,
				descriptors,
				preloadedDescriptors,
				scenes,
				focusedIndex: state.index,
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
				shouldShowFloatOverlay,
				stackProgress,
				optimisticFocusedIndex,
			],
		);

		return {
			value,
		};
	});

function withNativeLifecycle<TProps extends NativeLifecycleProps>(
	Component: React.ComponentType<NativeLifecycleContextValue>,
): React.FC<TProps> {
	const ComponentWithStackContext: React.FC<NativeLifecycleContextValue> = (
		props,
	) => {
		const routes = useMemo(
			() => props.scenes.map((s) => s.route),
			[props.scenes],
		);

		const routeKeys = useMemo(() => routes.map((r) => r.key), [routes]);

		const allDescriptors = useMemo(
			() => ({ ...props.preloadedDescriptors, ...props.descriptors }),
			[props.descriptors, props.preloadedDescriptors],
		);

		const stackContextValue = useMemo(
			() => ({
				flags: { TRANSITIONS_ALWAYS_ON: false }, // native-stack transitions are opt-in
				routeKeys,
				routes,
				descriptors: allDescriptors,
				focusedIndex: props.focusedIndex,
				stackProgress: props.stackProgress,
				optimisticFocusedIndex: props.optimisticFocusedIndex,
			}),
			[
				routeKeys,
				routes,
				allDescriptors,
				props.focusedIndex,
				props.stackProgress,
				props.optimisticFocusedIndex,
			],
		);

		return (
			<StackContext.Provider value={stackContextValue}>
				<Component {...props} />
			</StackContext.Provider>
		);
	};

	return withNativeLifecycleProvider(ComponentWithStackContext);
}

export { useNativeLifecycleContext, withNativeLifecycle };
