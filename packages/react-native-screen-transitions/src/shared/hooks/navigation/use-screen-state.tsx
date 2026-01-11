import type { Route } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { runOnUI, useDerivedValue } from "react-native-reanimated";
import {
	type BaseDescriptor,
	useKeys,
} from "../../providers/screen/keys.provider";
import { AnimationStore } from "../../stores/animation.store";
import type { ScreenTransitionConfig } from "../../types/screen.types";
import type { BaseStackNavigation } from "../../types/stack.types";
import { animateToProgress } from "../../utils/animation/animate-to-progress";
import { useSharedValueState } from "../reanimated/use-shared-value-state";
import { type StackContextValue, useStack } from "./use-stack";

const SNAP_SPRING = { damping: 50, stiffness: 500, mass: 1 };

export interface ScreenState<
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
> {
	/**
	 * The index of this screen in the stack.
	 */
	index: number;

	/**
	 * Screen options for the currently focused screen.
	 */
	options: ScreenTransitionConfig;

	/**
	 * All routes currently in the stack.
	 */
	routes: Route<string>[];

	/**
	 * Route of the currently focused screen in the stack.
	 */
	focusedRoute: Route<string>;

	/**
	 * Index of the focused route in the stack.
	 */
	focusedIndex: number;

	/**
	 * Custom metadata from the focused screen's options.
	 */
	meta?: Record<string, unknown>;

	/**
	 * Navigation object for this screen.
	 */
	navigation: TNavigation;

	/**
	 * Programmatically snap to a specific snap point by index.
	 * Only works if the screen has snapPoints defined.
	 *
	 * @param index - The index of the snap point to snap to (0-based)
	 */
	snapTo: (index: number) => void;
}

/**
 * Hook to access screen state information.
 *
 * Use this hook to get navigation state and screen information.
 */
export function useScreenState<
	TNavigation extends BaseStackNavigation = BaseStackNavigation,
>(): ScreenState<TNavigation> {
	const { routes, scenes, routeKeys, optimisticFocusedIndex } =
		useStack<StackContextValue>();
	const { current } = useKeys<BaseDescriptor>();

	const index = useMemo(
		() => routeKeys.indexOf(current.route.key),
		[routeKeys, current.route.key],
	);

	const focusedIndex = useSharedValueState(
		useDerivedValue(() => {
			const globalIndex = optimisticFocusedIndex.get();
			return Math.max(0, Math.min(globalIndex, routeKeys.length - 1));
		}),
	);

	const focusedScene = useMemo(() => {
		return scenes[focusedIndex] ?? scenes[scenes.length - 1];
	}, [scenes, focusedIndex]);

	const currentOptions = current.options;
	const snapPoints = currentOptions?.snapPoints;

	const snapTo = useCallback(
		(targetIndex: number) => {
			if (!snapPoints || snapPoints.length === 0) {
				console.warn("snapTo called but no snapPoints defined");
				return;
			}

			if (targetIndex < 0 || targetIndex >= snapPoints.length) {
				console.warn(
					`snapTo index ${targetIndex} out of bounds (0-${snapPoints.length - 1})`,
				);
				return;
			}

			const targetProgress = snapPoints[targetIndex];
			const routeKey = current.route.key;
			const animations = AnimationStore.getAll(routeKey);

			runOnUI(() => {
				"worklet";
				animateToProgress({
					target: targetProgress,
					animations,
					spec: { open: SNAP_SPRING, close: SNAP_SPRING },
				});
			})();
		},
		[snapPoints, current.route.key],
	);

	return useMemo(
		() => ({
			index,
			options: focusedScene?.descriptor?.options ?? {},
			routes,
			focusedRoute: focusedScene?.route ?? current.route,
			focusedIndex,
			meta: focusedScene?.descriptor?.options?.meta,
			navigation: current.navigation as TNavigation,
			snapTo,
		}),
		[
			index,
			focusedScene,
			routes,
			focusedIndex,
			current.navigation,
			current.route,
			snapTo,
		],
	);
}
