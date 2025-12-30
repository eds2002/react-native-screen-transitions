interface RouteWithKey {
	key: string;
}

export const routesAreIdentical = <Route extends RouteWithKey>(
	a: Route[],
	b: Route[],
): boolean => {
	if (a === b) return true;
	if (a.length !== b.length) return false;

	return a.every((route, index) => route === b[index]);
};
