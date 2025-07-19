import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { ScreenStore } from "../store";
import type {
	Any,
	BeforeRemoveEvent,
	FocusEvent,
	TransitionConfig,
	TransitionListeners,
} from "../types";
import { defaultScreenOptions } from "./default-screen-options";

export interface TransitionEventHandlersProps extends TransitionConfig {
	navigation: Any;
	route: RouteProp<ParamListBase, string>;
}

/**
 * Create a config for a screen
 *
 * @deprecated Use {@link createScreenConfig} instead
 */
export const createConfig = ({
	navigation: reactNavigation,
	route,
	...config
}: TransitionEventHandlersProps): TransitionListeners => {
	return {
		focus: (e: FocusEvent) => {
			const parentNavigatorKey = reactNavigation.getParent()?.getState?.()?.key;
			const navigatorKey = reactNavigation.getState().key;

			ScreenStore.updateScreen(e.target, {
				id: e.target,
				name: route.name,
				status: 1,
				closing: false,
				navigatorKey,
				parentNavigatorKey,
				...config,
			});
		},
		beforeRemove: (e: BeforeRemoveEvent) => {
			const shouldSkipPreventDefault = ScreenStore.shouldSkipPreventDefault(
				e.target,
				reactNavigation.getState(),
			);

			if (shouldSkipPreventDefault) {
				ScreenStore.removeScreen(e.target);
				return;
			}

			e.preventDefault();
			const handleFinish = (finished?: boolean) => {
				if (!finished) return;
				if (reactNavigation.canGoBack()) {
					reactNavigation.dispatch(e.data?.action);
					ScreenStore.removeScreen(e.target);
				}
			};

			ScreenStore.updateScreen(e.target, {
				status: 0,
				closing: true,
				onAnimationFinish: handleFinish,
			});
		},
	} as TransitionListeners;
};

/**
 * Create a config for a screen
 *
 * @param config - The config for the screen
 * @returns The config for the screen
 */
export const createScreenConfig = (
	config?: Omit<TransitionEventHandlersProps, "navigation" | "route">,
) => {
	const hasCustomOptions =
		config &&
		(config.screenStyleInterpolator ||
			config.gestureEnabled ||
			config.gestureDirection ||
			// Add other animation-related config checks
			Object.keys(config).some(
				(key) => !["navigation", "route"].includes(key), // Exclude navigation props
			));

	return {
		...(hasCustomOptions ? { options: defaultScreenOptions() } : {}),
		listeners: (l: Any) => createConfig({ ...l, ...(config || {}) }),
	};
};
