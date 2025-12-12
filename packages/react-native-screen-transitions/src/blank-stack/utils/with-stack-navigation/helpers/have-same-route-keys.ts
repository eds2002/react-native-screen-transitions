import type { Route } from "@react-navigation/native";

export const haveSameRouteKeys = (
	previous: Route<string>[],
	next: Route<string>[],
): boolean => {
	if (previous.length !== next.length) {
		return false;
	}

	return previous.every((route, index) => route?.key === next[index]?.key);
};
