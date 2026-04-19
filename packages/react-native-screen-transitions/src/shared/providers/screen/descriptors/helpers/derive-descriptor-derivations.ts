import type { BaseStackDescriptor } from "../../../../types/stack.types";

export interface DescriptorDerivations {
	previousScreenKey?: string;
	currentScreenKey: string;
	nextScreenKey?: string;
	isFirstKey: boolean;
	isTopMostScreen: boolean;
	ancestorKeys: string[];
	navigatorKey: string;
	ancestorNavigatorKeys: string[];
	hasConfiguredInterpolator: boolean;
	isBranchScreen: boolean;
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
	const previousScreenKey = previous?.route.key;
	const currentScreenKey = current.route.key;
	const nextScreenKey = next?.route.key;

	const navigationState = current.navigation.getState();
	const navigatorKey = navigationState?.key ?? "";
	const routes = navigationState?.routes ?? [];
	const isFirstKey =
		routes.findIndex((route) => route.key === current.route.key) === 0;
	const isTopMostScreen = !next;
	const hasConfiguredInterpolator =
		!!current.options.screenStyleInterpolator ||
		!!next?.options?.screenStyleInterpolator;

	const currentRoute = routes.find((route) => route.key === current.route.key);
	const hasBranchState = !!currentRoute && "state" in currentRoute;
	const nestedState = hasBranchState
		? (currentRoute as { state?: { key?: unknown } }).state
		: undefined;
	const branchNavigatorKey =
		typeof nestedState?.key === "string" ? nestedState.key : undefined;

	return {
		previousScreenKey,
		currentScreenKey,
		nextScreenKey,
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
