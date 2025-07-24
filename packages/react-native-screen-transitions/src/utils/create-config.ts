import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { ConfigStore } from "../store/config-store";
import type {
	Any,
	BeforeRemoveEvent,
	FocusEvent,
	TransitionConfig,
	TransitionListeners,
} from "../types";

export interface TransitionEventHandlersProps extends TransitionConfig {
	navigation: Any;
	route: RouteProp<ParamListBase, string>;
}

export const createConfig = ({
	navigation: reactNavigation,
	route,
	...config
}: TransitionEventHandlersProps): TransitionListeners => {
	return {
		focus: (e: FocusEvent) => {
			const parentNavigatorKey = reactNavigation.getParent()?.getState?.()?.key;
			const navigatorKey = reactNavigation.getState().key;

			ConfigStore.updateConfig(e.target, {
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
			const shouldSkipPreventDefault = ConfigStore.shouldSkipPreventDefault(
				e.target,
				reactNavigation.getState(),
			);

			if (shouldSkipPreventDefault) {
				ConfigStore.removeConfig(e.target);
				return;
			}

			e.preventDefault();
			const handleFinish = (finished?: boolean) => {
				if (!finished) return;
				if (reactNavigation.canGoBack()) {
					reactNavigation.dispatch(e.data?.action);
					ConfigStore.removeConfig(e.target);
				}
			};

			ConfigStore.updateConfig(e.target, {
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
	return {
		listeners: (l: Any) => createConfig({ ...l, ...(config || {}) }),
	};
};
