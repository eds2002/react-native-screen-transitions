import type { Route } from "@react-navigation/native";
import * as React from "react";
import { useMemo } from "react";
import {
	type DerivedValue,
	type SharedValue,
	useDerivedValue,
} from "react-native-reanimated";
import {
	StackContext,
	type StackContextValue,
} from "../../hooks/navigation/use-stack";
import { AnimationStore } from "../../stores/animation.store";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackScene,
	BaseStackState,
} from "../../types/stack.types";
import { useStackCoreContext } from "./core.provider";
import { calculateActiveScreensLimit } from "./helpers/active-screens-limit";
import { useLocalRoutes } from "./helpers/use-local-routes";

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
	handleCloseRoute: (payload: { route: BaseStackRoute }) => void;
	shouldShowFloatOverlay: boolean;
	focusedIndex: number;
	stackProgress: DerivedValue<number>;
	optimisticFocusedIndex: DerivedValue<number>;
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

	const { scenes, activeScreensLimit, shouldShowFloatOverlay, routeKeys } =
		useMemo(() => {
			const scenes: BaseStackScene<TDescriptor>[] = [];
			const routeKeys: string[] = [];
			let shouldShowFloatOverlay = false;

			for (const route of state.routes) {
				const descriptor = state.descriptors[route.key] as TDescriptor;
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
			flags,
			routeKeys,
			routes: state.routes as Route<string>[],
			descriptors: state.descriptors as Record<string, BaseStackDescriptor>,
			scenes: scenes as BaseStackScene[],
			focusedIndex,
			stackProgress,
			optimisticFocusedIndex,
		}),
		[
			routeKeys,
			state.routes,
			state.descriptors,
			scenes,
			focusedIndex,
			stackProgress,
			optimisticFocusedIndex,
			flags,
		],
	);

	// ManagedStack context value
	const lifecycleValue = useMemo<ManagedStackContextValue<TDescriptor>>(
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
