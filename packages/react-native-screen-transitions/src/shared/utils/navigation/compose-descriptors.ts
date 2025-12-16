interface RouteWithKey {
	key: string;
}

export const composeDescriptors = <
	R extends RouteWithKey,
	D extends Record<string, unknown>,
>(
	routes: R[],
	nextDescriptors: D,
	currentDescriptors: D,
): D => {
	const composed = {} as D;

	for (const route of routes) {
		(composed as Record<string, unknown>)[route.key] =
			nextDescriptors[route.key] ?? currentDescriptors[route.key];
	}

	return composed;
};
