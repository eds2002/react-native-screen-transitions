import { useCallback } from "react";
import { runOnUISync } from "react-native-worklets";
import { useBuilderStore } from "../../../providers/builder";
import { getMotionStore } from "../../../providers/motion";
import { LifecycleTransitionRequestKind } from "../../../providers/motion/hooks/use-transition-values";
import { dispatchCloseAction } from "../../../utils/navigation/close-action-replay";
import { useBlankStackStore } from "../state/blank-stack.provider";

export function useNavigationHelpers() {
	const route = useBuilderStore((store) => store.descriptors.current.route);
	const navigation = useBuilderStore(
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

		const {
			closing,
			actions: { requestLifecycleTransition },
		} = getMotionStore(route.key).state;

		// Publish before the remaining React commit delays JS's queued UI writes.
		runOnUISync(() => {
			"worklet";
			if (!closing.get()) {
				requestLifecycleTransition(LifecycleTransitionRequestKind.Close, 0);
			}
		});
		return true;
	}, [navigation, route, requestStackDismiss]);

	return { dismissScreen, requestDismiss };
}
