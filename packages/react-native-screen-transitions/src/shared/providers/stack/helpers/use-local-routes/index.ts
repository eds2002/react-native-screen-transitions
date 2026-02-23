import { StackActions } from "@react-navigation/native";
import { useLayoutEffect, useState } from "react";
import { useClosingRouteKeys } from "../../../../hooks/navigation/use-closing-route-keys";
import { usePrevious } from "../../../../hooks/navigation/use-previous";
import useStableCallback from "../../../../hooks/use-stable-callback";
import { BoundStore } from "../../../../stores/bounds";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
} from "../../../../types/stack.types";
import { syncRoutesWithRemoved } from "../../../../utils/navigation/sync-routes-with-removed";
import type { ManagedStackProps } from "../../managed.provider";
import { alignRoutesWithLatest } from "./helpers/align-routes-with-latest";
import { areDescriptorsEqual } from "./helpers/are-descriptors-equal";
import { haveSameRouteKeys } from "./helpers/have-same-route-keys";
import { routesAreIdentical } from "./helpers/routes-are-identical";

export const useLocalRoutes = <
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>(
	props: ManagedStackProps<TDescriptor, TNavigation>,
) => {
	type TRoute = TDescriptor["route"];
	type TDescriptorMap = Record<string, TDescriptor>;

	const previousRoutes = usePrevious(props.state.routes) ?? [];
	const closingRouteKeys = useClosingRouteKeys();

	const [localState, setLocalState] = useState(() => ({
		routes: props.state.routes as TRoute[],
		descriptors: props.descriptors as TDescriptorMap,
	}));

	useLayoutEffect(() => {
		const nextRoutesSnapshot = props.state.routes;
		const previousRoutesSnapshot = previousRoutes;

		setLocalState((current) => {
			if (nextRoutesSnapshot.length === 0) {
				const keysToClear: Record<string, true> = {};
				for (let i = 0; i < current.routes.length; i++) {
					keysToClear[current.routes[i].key] = true;
				}
				for (let i = 0; i < previousRoutesSnapshot.length; i++) {
					keysToClear[previousRoutesSnapshot[i].key] = true;
				}
				for (const routeKey in keysToClear) {
					BoundStore.clearByAncestor(routeKey);
				}
			}

			const routeKeysUnchanged = haveSameRouteKeys(
				previousRoutesSnapshot,
				nextRoutesSnapshot,
			);

			let derivedRoutes: TRoute[];
			let derivedDescriptors: TDescriptorMap;

			if (routeKeysUnchanged) {
				const result = alignRoutesWithLatest(
					current.routes,
					current.descriptors,
					nextRoutesSnapshot,
					props.descriptors,
				);

				derivedRoutes = result.routes as TRoute[];
				derivedDescriptors = result.descriptors as TDescriptorMap;
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

				derivedRoutes = result.routes as TRoute[];
				derivedDescriptors = result.descriptors as TDescriptorMap;
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
		({ route }: { route: BaseStackRoute }) => {
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
