import { useCallback } from "react";
import { useDescriptorsStore } from "../../providers/screen/descriptors";
import { useStack } from "./use-stack";

const createPopAction = () => ({
	type: "POP",
	payload: { count: 1 },
});

export function useNavigationHelpers() {
	const route = useDescriptorsStore((store) => store.current.route);
	const navigation = useDescriptorsStore((store) => store.current.navigation);
	const requestStackDismiss = useStack((stack) => stack.requestDismiss);

	const requestDismiss = useCallback((): boolean => {
		return requestStackDismiss?.({ route }) ?? false;
	}, [route, requestStackDismiss]);

	const dismissScreen = useCallback((): boolean => {
		const state = navigation.getState();
		const routeIndex = state.routes.findIndex(
			(stateRoute) => stateRoute.key === route.key,
		);
		const routeStillPresent = routeIndex !== -1;
		if (!routeStillPresent || routeIndex === 0) return false;

		navigation.dispatch({
			...createPopAction(),
			source: route.key,
			target: state.key,
		});
		return true;
	}, [navigation, route.key]);

	return { dismissScreen, requestDismiss };
}
