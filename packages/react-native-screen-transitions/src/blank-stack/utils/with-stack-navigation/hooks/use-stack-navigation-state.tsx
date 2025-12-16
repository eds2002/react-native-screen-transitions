import { type Route, StackActions } from "@react-navigation/native";
import { useLayoutEffect, useState } from "react";
import { useClosingRouteKeys } from "../../../../shared/hooks/navigation/use-closing-route-keys";
import { usePrevious } from "../../../../shared/hooks/use-previous";
import useStableCallback from "../../../../shared/hooks/use-stable-callback";
import { alignRoutesWithLatest } from "../../../../shared/utils/navigation/align-routes-with-latest";
import { areDescriptorsEqual } from "../../../../shared/utils/navigation/are-descriptors-equal";
import { haveSameRouteKeys } from "../../../../shared/utils/navigation/have-same-route-keys";
import { routesAreIdentical } from "../../../../shared/utils/navigation/routes-are-identical";
import { syncRoutesWithRemoved } from "../../../../shared/utils/navigation/sync-routes-with-removed";
import type { BlankStackDescriptorMap } from "../../../types";
import type { StackNavigationContextProps } from "../types";

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
