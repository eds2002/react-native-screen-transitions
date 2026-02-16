import type { Route } from "@react-navigation/native";
import * as React from "react";
import { useEffect, useMemo } from "react";
import {
	type DerivedValue,
	type SharedValue,
	useDerivedValue,
} from "react-native-reanimated";
import {
	StackContext,
	type StackContextValue,
} from "../../hooks/navigation/use-stack";
import {
	AnimationStore,
	type AnimationStoreMap,
} from "../../stores/animation.store";
import { HistoryStore } from "../../stores/history.store";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackScene,
	BaseStackState,
} from "../../types/stack.types";
import { isFloatOverlayVisible } from "../../utils/overlay/visibility";
import { useStackCoreContext } from "./core.provider";
import { useLocalRoutes } from "./helpers/use-local-routes";
import { useClosingRouteMap } from "./helpers/use-visually-closing-route-map";

/**
 * Props for managed stack - generic over descriptor and navigation types.
 * Defaults to base types for backward compatibility.
 */
export interface ManagedStackProps<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
> {
	state: BaseStackState<TDescriptor["route"]>;
	navigation: TNavigation;
	descriptors: Record<string, TDescriptor>;
	describe: (route: TDescriptor["route"], placeholder: boolean) => TDescriptor;
}

/**
 * Context value for managed stack - generic over descriptor type.
 */
interface ManagedStackContextValue<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> {
	routes: TDescriptor["route"][];
	descriptors: Record<string, TDescriptor>;
	scenes: BaseStackScene<TDescriptor>[];
	activeScreensLimit: number;
	closingRouteKeysShared: SharedValue<string[]>;
	closingRouteMap: React.RefObject<Readonly<Record<string, true>>>;
	handleCloseRoute: (payload: { route: BaseStackRoute }) => void;
	shouldShowFloatOverlay: boolean;
	focusedIndex: number;
	stackProgress: DerivedValue<number>;
	optimisticFocusedIndex: DerivedValue<number>;
	backdropBehaviors: string[];
}

const ManagedStackContext =
	React.createContext<ManagedStackContextValue | null>(null);
ManagedStackContext.displayName = "ManagedStack";

function useManagedStackContext<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
>(): ManagedStackContextValue<TDescriptor> {
	const context = React.useContext(ManagedStackContext);
	if (!context) {
		throw new Error(
			"useManagedStackContext must be used within ManagedStackProvider",
		);
	}
	return context as ManagedStackContextValue<TDescriptor>;
}

function useManagedStackValue<
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>(
	props: ManagedStackProps<TDescriptor, TNavigation>,
): ManagedStackContextValue<TDescriptor> & {
	stackContextValue: StackContextValue;
} {
	const { flags } = useStackCoreContext();
	const { state, handleCloseRoute, closingRouteKeys } = useLocalRoutes(props);

	const {
		scenes,
		activeScreensLimit,
		shouldShowFloatOverlay,
		routeKeys,
		backdropBehaviors,
		animationMaps,
	} = useMemo(() => {
		const routes = state.routes;
		const descriptors = state.descriptors;
		const scenes: BaseStackScene<TDescriptor>[] = [];
		const routeKeys: string[] = [];
		const backdropBehaviors: string[] = [];
		const animationMaps: AnimationStoreMap[] = [];

		let shouldShowFloatOverlay = false;
		let limit = 1;
		let stopLimit = false;

		for (let i = routes.length - 1; i >= 0; i--) {
			const route = routes[i];
			const descriptor = descriptors[route.key] as TDescriptor;
			const options = descriptor?.options;

			scenes[i] = { route, descriptor };
			routeKeys[i] = route.key;
			backdropBehaviors[i] = options?.backdropBehavior ?? "block";
			animationMaps[i] = AnimationStore.getAll(route.key);

			if (!shouldShowFloatOverlay) {
				shouldShowFloatOverlay = isFloatOverlayVisible(options);
			}

			if (!stopLimit) {
				const shouldKeepPrevious =
					(options as { detachPreviousScreen?: boolean })
						?.detachPreviousScreen !== true;

				if (shouldKeepPrevious) {
					limit += 1;
				} else {
					stopLimit = true;
				}
			}
		}

		const activeScreensLimit = Math.min(
			limit,
			routes.length === 0 ? 1 : routes.length,
		);

		return {
			scenes,
			routeKeys,
			backdropBehaviors,
			activeScreensLimit,
			shouldShowFloatOverlay,
			animationMaps,
		};
	}, [state.routes, state.descriptors]);

	// Aggregated stack progress from LOCAL routes (includes closing routes)
	const stackProgress = useDerivedValue(() => {
		"worklet";
		let total = 0;
		for (let i = 0; i < animationMaps.length; i++) {
			total += animationMaps[i].progress.value;
		}
		return total;
	});

	// Optimistic focused index: accounts for closing screens.
	// Counts consecutive closing screens from the top of the stack so that
	// rapid dismiss chains (e.g. dismiss C then B while C is still in flight)
	// correctly identify the actual focused screen for pointer-event gating.
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

	const focusedIndex = props.state.index;

	const closingRouteMap = useClosingRouteMap(routeKeys, animationMaps);

	const stackContextValue = useMemo<StackContextValue>(
		() => ({
			flags,
			routeKeys,
			routes: state.routes as Route<string>[],
			descriptors: state.descriptors as Record<string, BaseStackDescriptor>,
			scenes: scenes as BaseStackScene[],
			focusedIndex,
			stackProgress,
			optimisticFocusedIndex,
			closingRouteMap,
		}),
		[
			routeKeys,
			state.routes,
			state.descriptors,
			scenes,
			focusedIndex,
			stackProgress,
			optimisticFocusedIndex,
			closingRouteMap,
			flags,
		],
	);

	// ManagedStack context value
	const lifecycleValue = useMemo<ManagedStackContextValue<TDescriptor>>(
		() => ({
			routes: state.routes,
			descriptors: state.descriptors,
			scenes,
			closingRouteKeysShared: closingRouteKeys.shared,
			closingRouteMap,
			handleCloseRoute,
			focusedIndex,
			optimisticFocusedIndex,
			activeScreensLimit,
			shouldShowFloatOverlay,
			stackProgress,
			backdropBehaviors,
		}),
		[
			state.routes,
			state.descriptors,
			focusedIndex,
			closingRouteKeys.shared,
			closingRouteMap,
			handleCloseRoute,
			activeScreensLimit,
			scenes,
			shouldShowFloatOverlay,
			stackProgress,
			optimisticFocusedIndex,
			backdropBehaviors,
		],
	);

	return { ...lifecycleValue, stackContextValue };
}

/**
 * HOC that wraps component with ManagedStack provider AND StackContext.
 * Used by blank-stack which manages local route state for closing animations.
 * Generic over descriptor type - defaults to BaseStackDescriptor.
 */
function withManagedStack<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
>(
	Component: React.ComponentType<ManagedStackContextValue<TDescriptor>>,
): React.FC<ManagedStackProps<TDescriptor, TNavigation>> {
	return function ManagedStackProvider(
		props: ManagedStackProps<TDescriptor, TNavigation>,
	) {
		const navigatorKey = props.state.key;

		// Clean up history when navigator unmounts
		useEffect(() => {
			return () => {
				HistoryStore.clearNavigator(navigatorKey);
			};
		}, [navigatorKey]);

		const { stackContextValue, ...lifecycleValue } = useManagedStackValue<
			TDescriptor,
			TNavigation
		>(props);

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
