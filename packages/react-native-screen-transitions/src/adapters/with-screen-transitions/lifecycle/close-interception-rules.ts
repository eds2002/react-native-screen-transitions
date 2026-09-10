interface CloseInterceptionState {
	enabled: boolean;
	ownsAction: boolean;
	ancestorDismissing: boolean;
	routeIndex: number;
	focusedIndex: number;
}

interface NavigationRouteLike {
	key: string;
	state?: NavigationStateLike;
}

interface NavigationStateLike {
	key?: string;
	routes: NavigationRouteLike[];
}

interface NavigationActionLike {
	source?: unknown;
	target?: unknown;
}

const containsRouteKey = (
	routes: NavigationRouteLike[],
	routeKey: string,
): boolean =>
	routes.some(
		(route) =>
			route.key === routeKey ||
			(route.state ? containsRouteKey(route.state.routes, routeKey) : false),
	);

export const doesNavigatorOwnCloseAction = ({
	state,
	action,
}: {
	state: NavigationStateLike;
	action: NavigationActionLike;
}): boolean => {
	if (typeof action.target === "string") {
		return action.target === state.key;
	}

	if (typeof action.source === "string") {
		return containsRouteKey(state.routes, action.source);
	}

	return true;
};

/** Only the focused removable route owns a stack close transition. */
export const shouldInterceptClose = ({
	enabled,
	ownsAction,
	ancestorDismissing,
	routeIndex,
	focusedIndex,
}: CloseInterceptionState) =>
	enabled &&
	ownsAction &&
	!ancestorDismissing &&
	routeIndex > 0 &&
	routeIndex === focusedIndex;
