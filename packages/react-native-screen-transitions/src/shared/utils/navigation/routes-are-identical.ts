interface RouteWithKey {
	key: string;
}

export const routesAreIdentical = <T extends RouteWithKey>(
	a: T[],
	b: T[],
): boolean => {
	if (a === b) return true;
	if (a.length !== b.length) return false;

	return a.every((route, index) => route === b[index]);
};
