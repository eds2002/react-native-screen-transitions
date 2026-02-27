import { StackActions } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { useKeys } from "../../providers/screen/keys";

export function useNavigationHelpers() {
	const { current, next } = useKeys();

	const isFirstKey = useMemo(() => {
		const state = current.navigation.getState();
		const index = state.routes.findIndex(
			(route) => route.key === current.route.key,
		);
		return index === 0;
	}, [current]);

	const isTopMostScreen = !next;

	const dismissScreen = useCallback((): boolean => {
		const state = current.navigation.getState();
		const routeIndex = state.routes.findIndex(
			(route) => route.key === current.route.key,
		);
		const routeStillPresent = routeIndex !== -1;
		if (!routeStillPresent || routeIndex === 0) return false;

		current.navigation.dispatch({
			...StackActions.pop(),
			source: current.route.key,
			target: state.key,
		});
		return true;
	}, [current]);

	return { isFirstKey, dismissScreen, isTopMostScreen };
}
