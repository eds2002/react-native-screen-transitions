import { useCallback } from "react";
import { useDescriptorsStore } from "../../providers/screen/descriptors";
import { useBlankStackStore } from "../../providers/stack/blank-stack.provider";
import { AnimationStore } from "../../stores/animation.store";
import {
	LifecycleTransitionRequestKind,
	SystemStore,
} from "../../stores/system.store";
import { dispatchCloseAction } from "../../utils/navigation/close-action-replay";

export function useNavigationHelpers() {
	const route = useDescriptorsStore((store) => store.descriptors.current.route);
	const navigation = useDescriptorsStore(
		(store) => store.descriptors.current.navigation,
	);
	const requestStackDismiss = useBlankStackStore(
		(stack) => stack.requestDismiss,
	);

	const dismissScreen = useCallback((): boolean => {
		const state = navigation.getState();
		const routeIndex = state.routes.findIndex(
			(stateRoute) => stateRoute.key === route.key,
		);
		const routeStillPresent = routeIndex !== -1;
		if (!routeStillPresent || routeIndex === 0) return false;

		const action = {
			type: "POP",
			payload: { count: 1 },
			source: route.key,
			target: state.key,
		};
		dispatchCloseAction(action, (closeAction) => {
			navigation.dispatch(closeAction);
		});
		return true;
	}, [navigation, route.key]);

	const requestDismiss = useCallback((): boolean => {
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
	}, [navigation, route, requestStackDismiss]);

	return { dismissScreen, requestDismiss };
}
