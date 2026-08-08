import type { BaseStackRoute } from "../../../../types/stack.types";

export function resolvePresentedIndex(
	routes: BaseStackRoute[],
	focusedRouteKey: string | undefined,
	closingRouteKeys: ReadonlySet<string>,
): number {
	const focusedIndex = focusedRouteKey
		? routes.findIndex((route) => route.key === focusedRouteKey)
		: routes.length - 1;
	const resolvedFocusedIndex =
		focusedIndex >= 0 ? focusedIndex : routes.length - 1;

	for (let index = resolvedFocusedIndex; index >= 0; index -= 1) {
		const route = routes[index];
		if (route && !closingRouteKeys.has(route.key)) {
			return index;
		}
	}

	return resolvedFocusedIndex;
}
