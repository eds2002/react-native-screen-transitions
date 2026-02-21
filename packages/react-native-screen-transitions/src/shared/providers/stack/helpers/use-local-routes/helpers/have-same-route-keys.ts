import type { RouteWithKey } from "../../../../../types/stack.types";

export const haveSameRouteKeys = <Route extends RouteWithKey>(
	previous: Route[],
	next: Route[],
): boolean => {
	if (previous.length !== next.length) {
		return false;
	}

	return previous.every((route, index) => route?.key === next[index]?.key);
};
