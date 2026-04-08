import type { BaseStackDescriptor } from "../../../../types/stack.types";

/**
 * Derived navigation topology for the current descriptor.
 *
 * These values are structural facts from React Navigation state, not live
 * transition or gesture state.
 *
 * Key relationships:
 * - `currentScreenKey` is the current route key.
 * - `parentScreenKey` is the nearest focused ancestor screen route key.
 * - `ancestorKeys` is the full focused ancestor screen chain, nearest first.
 * - `branchNavigatorKey` is the nested navigator key mounted under the current route.
 */
export interface DescriptorDerivations {
	previousScreenKey?: string;
	currentScreenKey: string;
	nextScreenKey?: string;
	/** Nearest focused ancestor screen route key, if the current screen is nested. */
	parentScreenKey?: string;
	isFirstKey: boolean;
	isTopMostScreen: boolean;
	/** Focused ancestor screen route keys from nearest parent to root. */
	ancestorKeys: string[];
	navigatorKey: string;
	ancestorNavigatorKeys: string[];
	hasConfiguredInterpolator: boolean;
	isBranchScreen: boolean;
	/** Nested navigator key mounted under the current route, when present. */
	branchNavigatorKey?: string;
}

interface Params {
	previous?: BaseStackDescriptor;
	current: BaseStackDescriptor;
	next?: BaseStackDescriptor;
	ancestorKeys: string[];
	ancestorNavigatorKeys: string[];
}

export function deriveDescriptorDerivations({
	previous,
	current,
	next,
	ancestorKeys,
	ancestorNavigatorKeys,
}: Params): DescriptorDerivations {
	// Adjacent sibling screens in the current navigator.
	const previousScreenKey = previous?.route.key;
	const currentScreenKey = current.route.key;
	const nextScreenKey = next?.route.key;

	// Facts about the current navigator itself.
	const navigationState = current.navigation.getState();
	const navigatorKey = navigationState?.key ?? "";
	const routes = navigationState?.routes ?? [];
	const isFirstKey =
		routes.findIndex((route) => route.key === current.route.key) === 0;
	const isTopMostScreen = !next;
	const hasConfiguredInterpolator =
		!!current.options.screenStyleInterpolator ||
		!!next?.options?.screenStyleInterpolator;

	// Nested navigator mounted under the current route, if one exists.
	const currentRoute = routes.find((route) => route.key === current.route.key);
	const hasBranchState = !!currentRoute && "state" in currentRoute;

	const nestedState = hasBranchState
		? (
				currentRoute as {
					state?: {
						key?: unknown;
					};
				}
			).state
		: undefined;

	const branchNavigatorKey =
		typeof nestedState?.key === "string" ? nestedState.key : undefined;

	return {
		previousScreenKey,
		currentScreenKey,
		nextScreenKey,
		parentScreenKey: ancestorKeys[0],
		isFirstKey,
		isTopMostScreen,
		ancestorKeys,
		navigatorKey,
		ancestorNavigatorKeys,
		hasConfiguredInterpolator,
		isBranchScreen: hasBranchState,
		branchNavigatorKey,
	};
}
