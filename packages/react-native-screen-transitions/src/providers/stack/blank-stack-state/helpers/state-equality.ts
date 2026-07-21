import type {
	BaseStackDescriptor,
	RouteWithKey,
	StackDescriptorSource,
} from "../../../../types/stack.types";
import type { BlankStackDescriptorSources } from "./types";

export const areDescriptorsEqual = <
	DescriptorMap extends Record<string, unknown>,
>(
	a: DescriptorMap,
	b: DescriptorMap,
): boolean => {
	if (a === b) return true;

	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);

	if (aKeys.length !== bKeys.length) return false;

	return aKeys.every((key) => a[key] === b[key]);
};

export const setsAreEqual = <T>(
	left: ReadonlySet<T>,
	right: ReadonlySet<T>,
) => {
	if (left.size !== right.size) {
		return false;
	}

	for (const value of left) {
		if (!right.has(value)) {
			return false;
		}
	}

	return true;
};

export const routeKeyListsAreEqual = (
	a: readonly string[],
	b: readonly string[],
): boolean => {
	if (a === b) return true;
	if (a.length !== b.length) return false;

	return a.every((key, index) => key === b[index]);
};

export const routesHaveSameKeys = <Route extends RouteWithKey>(
	a: readonly Route[],
	b: readonly Route[],
): boolean => {
	if (a.length !== b.length) return false;

	return a.every((route, index) => route.key === b[index]?.key);
};

export const getRouteChildState = (route: RouteWithKey): unknown => {
	if (!route || typeof route !== "object") {
		return undefined;
	}

	const childStateSymbol = Object.getOwnPropertySymbols(route).find(
		(symbol) => symbol.description === "CHILD_STATE",
	);

	if (childStateSymbol && childStateSymbol in route) {
		return (route as unknown as Record<symbol, unknown>)[childStateSymbol];
	}

	return (route as { state?: unknown }).state;
};

export const getRouteChildStateMap = <Route extends RouteWithKey>(
	routes: Route[],
): Record<string, unknown> => {
	const childStates: Record<string, unknown> = {};

	for (const route of routes) {
		childStates[route.key] = getRouteChildState(route);
	}

	return childStates;
};

export const areRouteChildStateMapsEqual = (
	previous: Record<string, unknown>,
	next: Record<string, unknown>,
): boolean => {
	if (previous === next) return true;

	const previousKeys = Object.keys(previous);
	const nextKeys = Object.keys(next);

	if (previousKeys.length !== nextKeys.length) return false;

	return previousKeys.every((key) => Object.is(previous[key], next[key]));
};

export const areRecordsShallowEqual = (
	a: Record<string, unknown>,
	b: Record<string, unknown>,
): boolean => {
	if (a === b) return true;

	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);

	if (aKeys.length !== bKeys.length) return false;

	return aKeys.every((key) => Object.is(a[key], b[key]));
};

export const areDescriptorSourcesEquivalent = <
	TDescriptor extends BaseStackDescriptor,
>(
	previous: StackDescriptorSource<TDescriptor>,
	next: StackDescriptorSource<TDescriptor>,
): boolean => {
	return (
		previous.navigation === next.navigation &&
		areRecordsShallowEqual(
			previous.route as unknown as Record<string, unknown>,
			next.route as unknown as Record<string, unknown>,
		) &&
		areRecordsShallowEqual(
			previous.options as unknown as Record<string, unknown>,
			next.options as unknown as Record<string, unknown>,
		)
	);
};

export const areDescriptorSourceMapsEquivalent = <
	TDescriptor extends BaseStackDescriptor,
>(
	previous: BlankStackDescriptorSources<TDescriptor>,
	next: BlankStackDescriptorSources<TDescriptor>,
): boolean => {
	if (previous === next) return true;

	const previousKeys = Object.keys(previous);
	const nextKeys = Object.keys(next);

	if (previousKeys.length !== nextKeys.length) return false;

	return previousKeys.every((key) => {
		const previousDescriptor = previous[key];
		const nextDescriptor = next[key];

		if (!previousDescriptor || !nextDescriptor) {
			return false;
		}

		return areDescriptorSourcesEquivalent(previousDescriptor, nextDescriptor);
	});
};
