import type { Route } from "@react-navigation/native";
import { useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";
import {
	type BaseDescriptor,
	useKeys,
} from "../../providers/screen/keys.provider";
import type { ScreenTransitionConfig } from "../../types/screen.types";
import type { BaseStackNavigation } from "../../types/stack.types";
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

	return useMemo(
		() => ({
			index,
			options: focusedScene?.descriptor?.options ?? {},
			routes,
			focusedRoute: focusedScene?.route ?? current.route,
			focusedIndex,
			meta: focusedScene?.descriptor?.options?.meta,
			navigation: current.navigation as TNavigation,
		}),
		[
			index,
			focusedScene,
			routes,
			focusedIndex,
			current.navigation,
			current.route,
		],
	);
}
