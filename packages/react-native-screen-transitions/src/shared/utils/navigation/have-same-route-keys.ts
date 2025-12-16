interface RouteWithKey {
	key: string;
}

export const haveSameRouteKeys = <T extends RouteWithKey>(
	previous: T[],
	next: T[],
): boolean => {
	if (previous.length !== next.length) {
		return false;
	}

	return previous.every((route, index) => route?.key === next[index]?.key);
};
