import type { Route } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import {
	runOnUI,
	type SharedValue,
	useDerivedValue,
} from "react-native-reanimated";
import { DefaultSnapSpec } from "../../configs/specs";
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

	/**
	 * Animated value representing the current snap point index.
	 * Interpolates between indices during gestures (e.g., 0.5 means halfway between snap 0 and 1).
	 * Returns -1 if no snap points are defined.
	 */
	animatedSnapIndex: SharedValue<number>;
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
	const animations = useMemo(
		() => AnimationStore.getAll(current.route.key),
		[current.route.key],
	);

	// Pre-sort snap points for the derived value (avoids sorting in worklet)
	const sortedSnapPoints = useMemo(
		() => (snapPoints ? [...snapPoints].sort((a, b) => a - b) : []),
		[snapPoints],
	);

	const animatedSnapIndex = useDerivedValue(() => {
		if (sortedSnapPoints.length === 0) {
			return -1;
		}

		const progress = animations.progress.value;

		// Below first snap point
		if (progress <= sortedSnapPoints[0]) {
			return 0;
		}

		// Above last snap point
		if (progress >= sortedSnapPoints[sortedSnapPoints.length - 1]) {
			return sortedSnapPoints.length - 1;
		}

		// Find segment and interpolate
		for (let i = 0; i < sortedSnapPoints.length - 1; i++) {
			if (progress <= sortedSnapPoints[i + 1]) {
				const t =
					(progress - sortedSnapPoints[i]) /
					(sortedSnapPoints[i + 1] - sortedSnapPoints[i]);
				return i + t;
			}
		}

		return sortedSnapPoints.length - 1;
	});

	const snapTo = useCallback(
		(targetIndex: number) => {
			if (!sortedSnapPoints || sortedSnapPoints.length === 0) {
				console.warn("snapTo called but no snapPoints defined");
				return;
			}

			if (targetIndex < 0 || targetIndex >= sortedSnapPoints.length) {
				console.warn(
					`snapTo index ${targetIndex} out of bounds (0-${sortedSnapPoints.length - 1})`,
				);
				return;
			}

			const targetProgress = sortedSnapPoints[targetIndex];

			runOnUI(() => {
				"worklet";
				animateToProgress({
					target: targetProgress,
					animations,
					spec: {
						open:
							focusedScene.descriptor.options.transitionSpec?.expand ??
							DefaultSnapSpec,
						close:
							focusedScene.descriptor.options.transitionSpec?.collapse ??
							DefaultSnapSpec,
					},
				});
			})();
		},
		[sortedSnapPoints, animations, focusedScene],
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
			animatedSnapIndex,
		}),
		[
			index,
			focusedScene,
			routes,
			focusedIndex,
			current.navigation,
			current.route,
			snapTo,
			animatedSnapIndex,
		],
	);
}
