import { useCallback } from "react";
import { useDescriptorsStore } from "../../providers/screen/descriptors";
import { useStack } from "./use-stack";

const createPopAction = () => ({
	type: "POP",
	payload: { count: 1 },
});

export function useNavigationHelpers() {
	const current = useDescriptorsStore((store) => store.descriptors.current);
	const requestStackDismiss = useStack((stack) => stack.requestDismiss);

	const requestDismiss = useCallback((): boolean => {
		return requestStackDismiss?.({ route: current.route }) ?? false;
	}, [current.route, requestStackDismiss]);

	const dismissScreen = useCallback((): boolean => {
		const state = current.navigation.getState();
		const routeIndex = state.routes.findIndex(
			(route) => route.key === current.route.key,
		);
		const routeStillPresent = routeIndex !== -1;
		if (!routeStillPresent || routeIndex === 0) return false;

		current.navigation.dispatch({
			...createPopAction(),
			source: current.route.key,
			target: state.key,
		});
		return true;
	}, [current]);

	return { dismissScreen, requestDismiss };
}
