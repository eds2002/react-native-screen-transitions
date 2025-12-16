import { useCallback, useMemo, useRef, useState } from "react";
import createProvider from "../../../shared/utils/create-provider";
import type {
	ComponentRoute,
	ComponentStackDescriptorMap,
	ComponentStackScene,
} from "../../types";
import { useClosingRouteKeys } from "./hooks/use-closing-route-keys";
import type {
	ComponentNavigationContextProps,
	ComponentNavigationContextValue,
} from "./types";

/**
 * Calculate active screens limit based on screen options.
 * Simplified version without React Navigation descriptor lookup.
 */
function calculateActiveScreensLimit(
	routes: ComponentRoute[],
	descriptors: ComponentStackDescriptorMap,
): number {
	let limit = 1;

	for (let i = routes.length - 1; i >= 0; i--) {
		const route = routes[i];
		const descriptor = descriptors[route.key];
		const detachPreviousScreen = descriptor?.options?.detachPreviousScreen;

		if (detachPreviousScreen === false) {
			limit = routes.length - i;
		} else if (detachPreviousScreen === true) {
			break;
		}
	}

	return Math.min(limit + 1, routes.length);
}

const { withComponentNavigationProvider, useComponentNavigationContext } =
	createProvider("ComponentNavigation")<
		ComponentNavigationContextProps,
		ComponentNavigationContextValue
	>((props) => {
		const closingRouteKeys = useClosingRouteKeys();
		const prevRoutesRef = useRef<ComponentRoute[]>([]);

		// Track local routes that include closing routes
		const [localRoutes, setLocalRoutes] = useState<ComponentRoute[]>(
			props.state.routes,
		);
		const [localDescriptors, setLocalDescriptors] =
			useState<ComponentStackDescriptorMap>(props.descriptors);

		// Sync local state when props change
		useMemo(() => {
			const prevRoutes = prevRoutesRef.current;
			const nextRoutes = props.state.routes;

			// Detect if a route was removed (going back)
			if (prevRoutes.length > nextRoutes.length) {
				// Find the route that was removed
				const removedRoute = prevRoutes.find(
					(prevRoute) =>
						!nextRoutes.some((nextRoute) => nextRoute.key === prevRoute.key),
				);

				if (removedRoute) {
					// Mark as closing and keep in local state
					closingRouteKeys.add(removedRoute.key);
					setLocalRoutes([...nextRoutes, removedRoute]);
					setLocalDescriptors({ ...props.descriptors, ...localDescriptors });
				}
			} else {
				// Routes added or unchanged - sync directly
				setLocalRoutes(nextRoutes);
				setLocalDescriptors(props.descriptors);

				// Clean up any closing keys that are no longer relevant
				const activeKeys = new Set(nextRoutes.map((r) => r.key));
				for (const key of Array.from(closingRouteKeys.ref.current)) {
					if (!activeKeys.has(key)) {
						closingRouteKeys.remove(key);
					}
				}
			}

			prevRoutesRef.current = nextRoutes;
		}, [props.state.routes, props.descriptors, closingRouteKeys, localDescriptors]);

		const handleCloseRoute = useCallback(
			({ route }: { route: ComponentRoute }) => {
				closingRouteKeys.remove(route.key);

				setLocalRoutes((current) => {
					if (!current.some((r) => r.key === route.key)) {
						return current;
					}
					return current.filter((r) => r.key !== route.key);
				});

				setLocalDescriptors((current) => {
					const next = { ...current };
					delete next[route.key];
					return next;
				});
			},
			[closingRouteKeys],
		);

		const { scenes, activeScreensLimit, shouldShowFloatOverlay } =
			useMemo(() => {
				const scenes: ComponentStackScene[] = [];
				let shouldShowFloatOverlay = false;

				for (const route of localRoutes) {
					const descriptor = localDescriptors[route.key];
					if (!descriptor) continue;

					scenes.push({ route, descriptor });

					if (!shouldShowFloatOverlay) {
						const options = descriptor.options;
						shouldShowFloatOverlay =
							options?.overlayMode === "float" &&
							options?.overlayShown === true;
					}
				}

				return {
					scenes,
					activeScreensLimit: calculateActiveScreensLimit(
						localRoutes,
						localDescriptors,
					),
					shouldShowFloatOverlay,
				};
			}, [localRoutes, localDescriptors]);

		const value = useMemo(
			() => ({
				routes: localRoutes,
				focusedIndex: props.state.index,
				descriptors: localDescriptors,
				closingRouteKeysShared: closingRouteKeys.shared,
				activeScreensLimit,
				handleCloseRoute,
				scenes,
				shouldShowFloatOverlay,
				navigation: props.navigation,
			}),
			[
				localRoutes,
				localDescriptors,
				props.state.index,
				props.navigation,
				closingRouteKeys.shared,
				activeScreensLimit,
				handleCloseRoute,
				scenes,
				shouldShowFloatOverlay,
			],
		);

		return {
			value,
		};
	});

export { useComponentNavigationContext, withComponentNavigationProvider };
