import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { RouteStore } from "../store";
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
			const navigatorKey = reactNavigation.getState().key;

			RouteStore.updateRoute(e.target, {
				id: e.target,
				name: route.name,
				status: 1,
				closing: false,
				navigatorKey,
				...config,
			});
		},
		beforeRemove: (e: BeforeRemoveEvent) => {
			const navigatorState = reactNavigation.getState();

			const isLastScreenInStack =
				navigatorState.routes.length === 1 &&
				navigatorState.routes[0].key === e.target;

			if (isLastScreenInStack) {
				/**
				 * Without this guard, b/index would have a noticeable delay in it's back event. Then we will see the exit animation from b (layout).
				 *
				 * Since this is the last screen, we can assume the previous route is the parent. We'll let the parent handle it's exit animation instead.
				 */
				RouteStore.removeRoute(e.target);
				return;
			}

			e.preventDefault();

			const handleFinish = (finished?: boolean) => {
				if (!finished) return;
				if (reactNavigation.canGoBack()) {
					reactNavigation.dispatch(e.data?.action);
					RouteStore.removeRoute(e.target);
				}
			};

			RouteStore.updateRoute(e.target, {
				status: 0,
				closing: true,
				onAnimationFinish: handleFinish,
			});
		},
	} as TransitionListeners;
};
