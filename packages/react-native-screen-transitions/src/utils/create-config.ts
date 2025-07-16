import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { ScreenStore } from "../store";
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
