interface RouteWithKey {
	key: string;
}

export const composeDescriptors = <
	Route extends RouteWithKey,
	DescriptorMap extends Record<string, unknown>,
>(
	routes: Route[],
	nextDescriptors: DescriptorMap,
	currentDescriptors: DescriptorMap,
): DescriptorMap => {
	const composed = {} as DescriptorMap;

	for (const route of routes) {
		(composed as Record<string, unknown>)[route.key] =
			nextDescriptors[route.key] ?? currentDescriptors[route.key];
	}

	return composed;
};
