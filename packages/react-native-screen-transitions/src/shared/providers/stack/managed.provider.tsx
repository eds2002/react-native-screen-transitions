import type {
	NavigationRoute,
	ParamListBase,
	Route,
	RouteProp,
	StackNavigationState,
} from "@react-navigation/native";
import * as React from "react";
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
} from "../../../blank-stack/types";
import {
	StackContext,
	type StackContextValue,
} from "../../hooks/navigation/use-stack";
import { AnimationStore } from "../../stores/animation.store";
import { calculateActiveScreensLimit } from "./helpers/active-screens-limit";
import { useLocalRoutes } from "./helpers/use-local-routes";

export interface ManagedStackProps {
	state: StackNavigationState<ParamListBase>;
	navigation: BlankStackNavigationHelpers;
	descriptors: BlankStackDescriptorMap;
	describe: (
		route: RouteProp<ParamListBase>,
		placeholder: boolean,
	) => BlankStackDescriptor;
}

interface ManagedStackContextValue {
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

const ManagedStackContext =
	React.createContext<ManagedStackContextValue | null>(null);
ManagedStackContext.displayName = "ManagedStack";

function useManagedStackContext(): ManagedStackContextValue {
	const context = React.useContext(ManagedStackContext);
	if (!context) {
		throw new Error(
			"useManagedStackContext must be used within ManagedStackProvider",
		);
	}
	return context;
}

function useManagedStackValue(
	props: ManagedStackProps,
): ManagedStackContextValue & { stackContextValue: StackContextValue } {
	const { state, handleCloseRoute, closingRouteKeys } = useLocalRoutes(props);

	const { scenes, activeScreensLimit, shouldShowFloatOverlay, routeKeys } =
		useMemo(() => {
			const scenes: BlankStackScene[] = [];
			const routeKeys: string[] = [];
			let shouldShowFloatOverlay = false;

			for (const route of state.routes) {
				const descriptor = state.descriptors[route.key];
				scenes.push({ route, descriptor });
				routeKeys.push(route.key);

				if (!shouldShowFloatOverlay) {
					const options = descriptor?.options;
					shouldShowFloatOverlay =
						options?.overlayMode === "float" && options?.overlayShown === true;
				}
			}

			return {
				scenes,
				routeKeys,
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

	// StackContext value - for overlays via useStack()
	const stackContextValue = useMemo<StackContextValue>(
		() => ({
			flags: { TRANSITIONS_ALWAYS_ON: true },
			routeKeys,
			routes: state.routes,
			descriptors: state.descriptors,
			focusedIndex,
			stackProgress,
			optimisticFocusedIndex,
		}),
		[
			routeKeys,
			state.routes,
			state.descriptors,
			focusedIndex,
			stackProgress,
			optimisticFocusedIndex,
		],
	);

	// ManagedStack context value
	const lifecycleValue = useMemo<ManagedStackContextValue>(
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

	return { ...lifecycleValue, stackContextValue };
}

/**
 * HOC that wraps component with ManagedStack provider AND StackContext.
 * Used by blank-stack which manages local route state for closing animations.
 */
function withManagedStack<TProps extends ManagedStackProps>(
	Component: React.ComponentType<ManagedStackContextValue>,
): React.FC<TProps> {
	return function ManagedStackProvider(props: TProps) {
		const { stackContextValue, ...lifecycleValue } =
			useManagedStackValue(props);

		return (
			<StackContext.Provider value={stackContextValue}>
				<ManagedStackContext.Provider value={lifecycleValue}>
					<Component {...lifecycleValue} />
				</ManagedStackContext.Provider>
			</StackContext.Provider>
		);
	};
}

export { useManagedStackContext, withManagedStack };
