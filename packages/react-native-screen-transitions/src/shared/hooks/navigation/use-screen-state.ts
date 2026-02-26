import type { Route } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { snapDescriptorToIndex } from "../../animation/snap-to";
import { type BaseDescriptor, useKeys } from "../../providers/screen/keys";
import type { ScreenTransitionConfig } from "../../types/screen.types";
import type { BaseStackNavigation } from "../../types/stack.types";
import { useOptimisticFocusedIndex } from "./use-optimistic-focused-index";
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
	 * Programmatically snap the focused screen to a snap point index.
	 *
	 * Scoped to this screen's stack context, avoiding global history ambiguity.
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

	const focusedIndex = useOptimisticFocusedIndex(
		optimisticFocusedIndex,
		routeKeys.length,
	);

	const focusedScene = useMemo(() => {
		return scenes[focusedIndex] ?? scenes[scenes.length - 1];
	}, [scenes, focusedIndex]);

	const snapTo = useCallback(
		(targetIndex: number) => {
			const descriptor = focusedScene?.descriptor;
			if (!descriptor) return;
			snapDescriptorToIndex(descriptor, targetIndex);
		},
		[focusedScene],
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
