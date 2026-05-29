import type { ManagedStackProps } from "../../../../../types/providers/managed-stack.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	RouteWithKey,
} from "../../../../../types/stack.types";
import { buildManagedStackState } from "./build-managed-stack-state";
import {
	areDescriptorSourceMapsEquivalent,
	areDescriptorsEqual,
	areRouteChildStateMapsEqual,
	getRouteChildStateMap,
	setsAreEqual,
} from "./helpers";
import { reconcileManagedRoutes } from "./reconcile-managed-routes";
import type { LocalRoutesState, ManagedRoutes } from "./types";

type DeriveManagedStackStateParams<
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
> = {
	props: ManagedStackProps<TDescriptor, TNavigation>;
	current: LocalRoutesState<TDescriptor>;
	previousRoutesSnapshot: ManagedRoutes<TDescriptor>;
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

const routeKeysAreEqual = <Route extends RouteWithKey>(
	a: Route[],
	b: Route[],
): boolean => {
	if (a.length !== b.length) return false;

	return a.every((route, index) => route.key === b[index]?.key);
};

export const deriveManagedStackState = <
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>({
	props,
	current,
	previousRoutesSnapshot,
	closingRouteKeys,
}: DeriveManagedStackStateParams<
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

	// When committing a soft dismiss, first check whether local state and
	// React Navigation's latest route/descriptor shape are already aligned.
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
		routeKeysAreEqual(current.routes, nextRoutesSnapshot) &&
		areDescriptorSourceMapsEquivalent(
			current.sourceDescriptors,
			nextDescriptors,
		);

	if (logicallyAligned) {
		return current;
	}

	const result = reconcileManagedRoutes({
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

	return buildManagedStackState({
		props,
		routes: routesChanged ? result.routes : current.routes,
		descriptors: descriptorsChanged
			? result.descriptors
			: current.sourceDescriptors,
		closingRouteKeys,
		previousState: current,
	});
};
