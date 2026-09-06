import { useCallback } from "react";
import { useBuilderStore } from "../../providers/screen/builder";
import { LifecycleTransitionRequestKind } from "../../providers/screen/builder/hooks/use-builder-animation-state";
import { getMotionStore } from "../../providers/screen/motion";
import { useBlankStackStore } from "../../providers/stack/blank-stack.provider";
import { dispatchCloseAction } from "../../utils/navigation/close-action-replay";

export function useNavigationHelpers() {
	const route = useBuilderStore((store) => store.descriptors.current.route);
	const navigation = useBuilderStore(
		(store) => store.descriptors.current.navigation,
	);
	const system = useBuilderStore((store) => store.animationState);
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

		if (!getMotionStore(route.key).state.closing.get()) {
			system.actions.requestLifecycleTransition(
				LifecycleTransitionRequestKind.Close,
				0,
			);
		}
		return true;
	}, [navigation, route, requestStackDismiss, system]);

	return { dismissScreen, requestDismiss };
}
