import {
	StackActions,
	usePreventRemoveContext,
} from "@react-navigation/native";
import { useCallback } from "react";
import { useDescriptorsStore } from "../../providers/screen/descriptors";
import { AnimationStore } from "../../stores/animation.store";
import {
	LifecycleTransitionRequestKind,
	SystemStore,
} from "../../stores/system.store";
import { dispatchCloseAction } from "../../utils/navigation/close-action-replay";
import { useStack } from "./use-stack";

export function useNavigationHelpers() {
	const route = useDescriptorsStore((store) => store.current.route);
	const navigation = useDescriptorsStore((store) => store.current.navigation);
	const requestStackDismiss = useStack((stack) => stack.requestDismiss);
	const { preventedRoutes } = usePreventRemoveContext();
	const isRemovePrevented = preventedRoutes[route.key]?.preventRemove === true;

	const dismissScreen = useCallback((): boolean => {
		const state = navigation.getState();
		const routeIndex = state.routes.findIndex(
			(stateRoute) => stateRoute.key === route.key,
		);
		const routeStillPresent = routeIndex !== -1;
		if (!routeStillPresent || routeIndex === 0) return false;

		const action = {
			...StackActions.pop(),
			source: route.key,
			target: state.key,
		};
		dispatchCloseAction(action, (closeAction) => {
			navigation.dispatch(closeAction);
		});
		return true;
	}, [navigation, route.key]);

	const requestDismiss = useCallback((): boolean => {
		if (isRemovePrevented) return false;

		if (requestStackDismiss) {
			if (!requestStackDismiss({ route })) return false;
		} else {
			const state = navigation.getState();
			const routeIndex = state.routes.findIndex(
				(stateRoute) => stateRoute.key === route.key,
			);
			if (routeIndex <= 0) return false;
		}

		if (!AnimationStore.getValue(route.key, "closing").get()) {
			SystemStore.getBag(route.key).actions.requestLifecycleTransition(
				LifecycleTransitionRequestKind.Close,
				0,
			);
		}
		return true;
	}, [isRemovePrevented, navigation, route, requestStackDismiss]);

	return { dismissScreen, isRemovePrevented, requestDismiss };
}
