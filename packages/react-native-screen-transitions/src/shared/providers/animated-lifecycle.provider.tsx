import type {
	NavigationRoute,
	ParamListBase,
	Route,
	RouteProp,
	StackNavigationState,
} from "@react-navigation/native";
import { useMemo } from "react";
import {
	type DerivedValue,
	type SharedValue,
	useDerivedValue,
} from "react-native-reanimated";
import type {
	BlankStackDescriptor,
	BlankStackDescriptorMap,
	BlankStackNavigationHelpers,
	BlankStackScene,
} from "../../blank-stack/types";
import { StackContext } from "../hooks/use-stack";
import { AnimationStore } from "../stores/animation.store";
import createProvider from "../utils/create-provider";
import { calculateActiveScreensLimit } from "./animated-lifecycle/calculate-active-screens-limit";
import { useAnimatedLifecycleState } from "./animated-lifecycle/use-animated-lifecycle-state";

export interface AnimatedLifecycleProps {
	state: StackNavigationState<ParamListBase>;
	navigation: BlankStackNavigationHelpers;
	descriptors: BlankStackDescriptorMap;
	describe: (
		route: RouteProp<ParamListBase>,
		placeholder: boolean,
	) => BlankStackDescriptor;
}

export interface AnimatedLifecycleContextValue {
	routes: NavigationRoute<ParamListBase, string>[];
	descriptors: BlankStackDescriptorMap;
	scenes: BlankStackScene[];
	activeScreensLimit: number;
	closingRouteKeysShared: SharedValue<string[]>;
	handleCloseRoute: (payload: { route: Route<string> }) => void;
	shouldShowFloatOverlay: boolean;
	focusedIndex: number;
	stackProgress: DerivedValue<number>;
	optimisticFocusedIndex: DerivedValue<number>;
}

const { withAnimatedLifecycleProvider, useAnimatedLifecycleContext } =
	createProvider("AnimatedLifecycle")<
		AnimatedLifecycleProps,
		AnimatedLifecycleContextValue
	>((props) => {
		const { state, handleCloseRoute, closingRouteKeys } =
			useAnimatedLifecycleState(props);

		const { scenes, activeScreensLimit, shouldShowFloatOverlay } =
			useMemo(() => {
				const scenes: BlankStackScene[] = [];
				let shouldShowFloatOverlay = false;

				for (const route of state.routes) {
					const descriptor = state.descriptors[route.key];
					scenes.push({ route, descriptor });

					if (!shouldShowFloatOverlay) {
						const options = descriptor?.options;
						shouldShowFloatOverlay =
							options?.overlayMode === "float" &&
							options?.overlayShown === true;
					}
				}

				return {
					scenes,
					activeScreensLimit: calculateActiveScreensLimit(
						state.routes,
						state.descriptors,
					),
					shouldShowFloatOverlay,
				};
			}, [state.routes, state.descriptors]);

		// Get animation store maps for LOCAL routes (including closing routes)
		const animationMaps = useMemo(
			() => state.routes.map((route) => AnimationStore.getAll(route.key)),
			[state.routes],
		);

		// Aggregated stack progress from LOCAL routes (includes closing routes)
		const stackProgress = useDerivedValue(() => {
			"worklet";
			let total = 0;
			for (let i = 0; i < animationMaps.length; i++) {
				total += animationMaps[i].progress.value;
			}
			return total;
		});

		// Optimistic focused index: accounts for closing screens
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
			return currentIndex - Number(isAnyClosing);
		});

		const focusedIndex = props.state.index;

		const value = useMemo(
			() => ({
				routes: state.routes,
				focusedIndex,
				descriptors: state.descriptors,
				closingRouteKeysShared: closingRouteKeys.shared,
				activeScreensLimit,
				handleCloseRoute,
				scenes,
				shouldShowFloatOverlay,
				stackProgress,
				optimisticFocusedIndex,
			}),
			[
				state.routes,
				state.descriptors,
				focusedIndex,
				closingRouteKeys.shared,
				activeScreensLimit,
				handleCloseRoute,
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

/**
 * Custom HOC that wraps component with AnimatedLifecycle provider AND StackContext.
 * This allows useStack() hook to work in both blank-stack and native-stack.
 */
function withAnimatedLifecycle<TProps extends AnimatedLifecycleProps>(
	Component: React.ComponentType<AnimatedLifecycleContextValue>,
): React.FC<TProps> {
	// Wrap the component to provide StackContext from the AnimatedLifecycle context
	const ComponentWithStackContext: React.FC<AnimatedLifecycleContextValue> = (
		props,
	) => {
		const routeKeys = useMemo(
			() => props.routes.map((r) => r.key),
			[props.routes],
		);

		const stackContextValue = useMemo(
			() => ({
				flags: { TRANSITIONS_ALWAYS_ON: true }, // blank-stack always has transitions
				routeKeys,
				routes: props.routes,
				descriptors: props.descriptors,
				focusedIndex: props.focusedIndex,
				stackProgress: props.stackProgress,
				optimisticFocusedIndex: props.optimisticFocusedIndex,
			}),
			[
				routeKeys,
				props.routes,
				props.descriptors,
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

	return withAnimatedLifecycleProvider(ComponentWithStackContext);
}

export { useAnimatedLifecycleContext, withAnimatedLifecycle };
