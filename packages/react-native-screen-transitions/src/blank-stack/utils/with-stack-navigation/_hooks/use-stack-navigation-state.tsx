import { type Route, StackActions } from "@react-navigation/native";
import { useLayoutEffect, useState } from "react";
import useStableCallback from "../../../../shared/hooks/use-stable-callback";
import type { BlankStackDescriptorMap } from "../../../types";
import type { StackNavigationContextProps } from "../_types";
import { areDescriptorsEqual } from "../_utils/are-descriptors-equal";
import { composeDescriptors } from "../_utils/compose-descriptors";
import { haveSameRouteKeys } from "../_utils/have-same-route-keys";
import { routesAreIdentical } from "../_utils/routes-are-identical";
import { useClosingRouteKeys } from "./use-closing-route-keys";
import { usePrevious } from "./use-previous";

type SyncRoutesWithRemovedParams = {
	prevRoutes: Route<string>[];
	prevDescriptors: BlankStackDescriptorMap;
	nextRoutes: Route<string>[];
	nextDescriptors: BlankStackDescriptorMap;
	closingRouteKeys: ReturnType<typeof useClosingRouteKeys>;
};

/**
 * Aligns current routes with the latest route data while preserving references
 * when possible for performance optimization
 */
const alignRoutesWithLatest = (
	currentRoutes: Route<string>[],
	currentDescriptors: BlankStackDescriptorMap,
	nextRoutes: Route<string>[],
	nextDescriptors: BlankStackDescriptorMap,
) => {
	// Early return for empty current routes
	if (currentRoutes.length === 0) {
		return {
			routes: nextRoutes,
			descriptors: composeDescriptors(
				nextRoutes,
				nextDescriptors,
				currentDescriptors,
			),
		};
	}

	// Create lookup map for efficient route finding
	const nextRouteLookup = new Map<string, Route<string>>();
	for (const route of nextRoutes) {
		nextRouteLookup.set(route.key, route);
	}

	// Track if any changes occurred
	let didChange = currentRoutes.length !== nextRoutes.length;

	// Align routes, updating references where needed
	const alignedRoutes = currentRoutes.map((route) => {
		const nextRoute = nextRouteLookup.get(route.key);

		if (!nextRoute) {
			return route; // Keep current route if not in next
		}

		if (nextRoute !== route) {
			didChange = true;
			return nextRoute; // Update to new route reference
		}

		return route; // Keep current route reference
	});

	// Only create new array if changes occurred
	const routesResult = didChange ? alignedRoutes : currentRoutes;

	return {
		routes: routesResult,
		descriptors: composeDescriptors(
			routesResult,
			nextDescriptors,
			currentDescriptors,
		),
	};
};

/**
 * Synchronizes routes while handling removed routes that may still be animating out.
 * This manages the complex logic of keeping closing routes visible during transitions.
 */
const syncRoutesWithRemoved = ({
	prevRoutes,
	prevDescriptors,
	nextRoutes,
	nextDescriptors,
	closingRouteKeys,
}: SyncRoutesWithRemovedParams) => {
	if (nextRoutes.length === 0) {
		closingRouteKeys.clear();
		return {
			routes: nextRoutes,
			descriptors: {},
		};
	}

	// Start with next routes, will mutate if needed
	let derivedRoutes: Route<string>[] = nextRoutes;
	let mutated = false;

	// Helper to ensure we're working with a mutable copy
	const ensureMutable = () => {
		if (!mutated) {
			derivedRoutes = derivedRoutes.slice();
			mutated = true;
		}
	};

	// Get focused (last) routes for comparison
	const previousFocusedRoute = prevRoutes[prevRoutes.length - 1];
	const nextFocusedRoute = nextRoutes[nextRoutes.length - 1];

	// Handle focus changes between routes
	if (
		previousFocusedRoute &&
		nextFocusedRoute &&
		previousFocusedRoute.key !== nextFocusedRoute.key
	) {
		const nextRouteWasPresent = prevRoutes.some(
			(route) => route.key === nextFocusedRoute.key,
		);
		const previousRouteStillPresent = nextRoutes.some(
			(route) => route.key === previousFocusedRoute.key,
		);

		if (nextRouteWasPresent && !previousRouteStillPresent) {
			// Previous route was removed, mark as closing
			closingRouteKeys.add(previousFocusedRoute.key);

			ensureMutable();
			derivedRoutes.push(previousFocusedRoute);
		} else {
			// Next route is now active, not closing
			closingRouteKeys.remove(nextFocusedRoute.key);

			if (!previousRouteStillPresent) {
				// Previous route needs to be inserted for transition
				closingRouteKeys.remove(previousFocusedRoute.key);

				ensureMutable();
				const insertIndex = Math.max(derivedRoutes.length - 1, 0);
				derivedRoutes.splice(insertIndex, 0, previousFocusedRoute);
			}
		}
	} else if (nextFocusedRoute) {
		// Same focused route, ensure it's not marked as closing
		closingRouteKeys.remove(nextFocusedRoute.key);
	}

	// Clean up closing keys that are no longer in the route list
	const activeKeys = new Set(derivedRoutes.map((route) => route.key));
	for (const key of Array.from(closingRouteKeys.ref.current)) {
		if (!activeKeys.has(key)) {
			closingRouteKeys.remove(key);
		}
	}

	const routesResult = mutated ? derivedRoutes : nextRoutes;

	return {
		routes: routesResult,
		descriptors: composeDescriptors(
			routesResult,
			nextDescriptors,
			prevDescriptors,
		),
	};
};

export const useStackNavigationState = (props: StackNavigationContextProps) => {
	const previousRoutes = usePrevious(props.state.routes) ?? [];
	const closingRouteKeys = useClosingRouteKeys();

	const [localState, setLocalState] = useState(() => ({
		routes: props.state.routes,
		descriptors: props.descriptors,
	}));

	useLayoutEffect(() => {
		const nextRoutesSnapshot = props.state.routes;
		const previousRoutesSnapshot = previousRoutes;

		setLocalState((current) => {
			const routeKeysUnchanged = haveSameRouteKeys(
				previousRoutesSnapshot,
				nextRoutesSnapshot,
			);

			let derivedRoutes: Route<string>[];
			let derivedDescriptors: BlankStackDescriptorMap;

			if (routeKeysUnchanged) {
				const result = alignRoutesWithLatest(
					current.routes,
					current.descriptors,
					nextRoutesSnapshot,
					props.descriptors,
				);

				derivedRoutes = result.routes;
				derivedDescriptors = result.descriptors;
			} else {
				const fallbackRoutes =
					previousRoutesSnapshot.length > 0
						? previousRoutesSnapshot
						: current.routes;

				const result = syncRoutesWithRemoved({
					prevRoutes: fallbackRoutes,
					prevDescriptors: current.descriptors,
					nextRoutes: nextRoutesSnapshot,
					nextDescriptors: props.descriptors,
					closingRouteKeys,
				});

				derivedRoutes = result.routes;
				derivedDescriptors = result.descriptors;
			}

			const routesChanged = !routesAreIdentical(current.routes, derivedRoutes);
			const descriptorsChanged = !areDescriptorsEqual(
				current.descriptors,
				derivedDescriptors,
			);

			if (!routesChanged && !descriptorsChanged) {
				return current;
			}

			return {
				routes: routesChanged ? derivedRoutes : current.routes,
				descriptors: descriptorsChanged
					? derivedDescriptors
					: current.descriptors,
			};
		});
	}, [props.state.routes, props.descriptors, previousRoutes, closingRouteKeys]);

	const handleCloseRoute = useStableCallback(
		({ route }: { route: Route<string> }) => {
			if (props.state.routes.some((r) => r.key === route.key)) {
				props.navigation.dispatch({
					...StackActions.pop(),
					source: route.key,
					target: props.state.key,
				});
				return;
			}

			closingRouteKeys.remove(route.key);

			setLocalState((current) => {
				if (!current.routes.some((candidate) => candidate.key === route.key)) {
					return current;
				}

				const nextRoutes = current.routes.filter(
					(candidate) => candidate.key !== route.key,
				);

				const nextDescriptors = { ...current.descriptors };
				delete nextDescriptors[route.key];

				return {
					routes: nextRoutes,
					descriptors: nextDescriptors,
				};
			});
		},
	);

	return {
		state: localState,
		handleCloseRoute,
		closingRouteKeys,
	};
};
