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
			RouteStore.updateRoute(e.target, {
				id: e.target,
				name: route.name,
				status: 1,
				closing: false,
				...config,
			});
		},
		beforeRemove: (e: BeforeRemoveEvent) => {
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
