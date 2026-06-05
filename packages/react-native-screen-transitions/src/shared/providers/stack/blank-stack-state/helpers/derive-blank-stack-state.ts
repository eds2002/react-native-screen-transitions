import type { BlankStackProviderProps } from "../../../../types/providers/blank-stack-provider.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	RouteWithKey,
} from "../../../../types/stack.types";
import { buildBlankStackState } from "./build-blank-stack-state";
import { reconcileBlankStackRoutes } from "./reconcile-blank-stack-routes";
import {
	areDescriptorSourceMapsEquivalent,
	areDescriptorsEqual,
	areRouteChildStateMapsEqual,
	getRouteChildStateMap,
	routesHaveSameKeys,
	setsAreEqual,
} from "./state-equality";
import type { BlankStackRoutes, LocalRoutesState } from "./types";

type DeriveBlankStackStateParams<
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
> = {
	props: BlankStackProviderProps<TDescriptor, TNavigation>;
	current: LocalRoutesState<TDescriptor>;
	previousRoutesSnapshot: BlankStackRoutes<TDescriptor>;
	closingRouteKeys: Set<string>;
};

const routesAreIdentical = <Route extends RouteWithKey>(
	a: Route[],
	b: Route[],
): boolean => {
	if (a === b) return true;
	if (a.length !== b.length) return false;

	return a.every((route, index) => route === b[index]);
};

export const deriveBlankStackState = <
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>({
	props,
	current,
	previousRoutesSnapshot,
	closingRouteKeys,
}: DeriveBlankStackStateParams<
	TDescriptor,
	TNavigation
>): LocalRoutesState<TDescriptor> => {
	const nextRoutesSnapshot = props.state.routes;
	const nextDescriptors = props.descriptors;
	const nextRouteChildStates = getRouteChildStateMap(nextRoutesSnapshot);
	const nextFocusedRouteKey = nextRoutesSnapshot[props.state.index]?.key;
	const focusedRouteUnchanged = current.focusedRouteKey === nextFocusedRouteKey;
	const closingRouteKeysUnchanged = setsAreEqual(
		current.closingRouteKeys,
		closingRouteKeys,
	);
	const routeChildStatesUnchanged = areRouteChildStateMapsEqual(
		current.routeChildStates,
		nextRouteChildStates,
	);

	const alreadyAligned =
		focusedRouteUnchanged &&
		closingRouteKeysUnchanged &&
		routeChildStatesUnchanged &&
		routesAreIdentical(current.routes, nextRoutesSnapshot) &&
		areDescriptorsEqual(current.sourceDescriptors, nextDescriptors);

	if (alreadyAligned) {
		return current;
	}

	const logicallyAligned =
		focusedRouteUnchanged &&
		closingRouteKeysUnchanged &&
		routeChildStatesUnchanged &&
		routesHaveSameKeys(current.routes, nextRoutesSnapshot) &&
		areDescriptorSourceMapsEquivalent(
			current.sourceDescriptors,
			nextDescriptors,
		);

	if (logicallyAligned) {
		return current;
	}

	const result = reconcileBlankStackRoutes({
		current,
		previousRoutesSnapshot,
		nextRoutesSnapshot,
		nextDescriptors,
		closingRouteKeys,
	});

	const routesChanged = !routesAreIdentical(current.routes, result.routes);
	const descriptorsChanged = !areDescriptorsEqual(
		current.sourceDescriptors,
		result.descriptors,
	);
	const closingRouteKeysChanged = !setsAreEqual(
		current.closingRouteKeys,
		closingRouteKeys,
	);

	if (!routesChanged && !descriptorsChanged && !closingRouteKeysChanged) {
		return current;
	}

	return buildBlankStackState({
		props,
		routes: routesChanged ? result.routes : current.routes,
		descriptors: descriptorsChanged
			? result.descriptors
			: current.sourceDescriptors,
		closingRouteKeys,
		previousState: current,
	});
};
