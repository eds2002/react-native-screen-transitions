import { useMemo, useRef, useState } from "react";
import useStableCallback from "../../../shared/hooks/use-stable-callback";
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

/**
 * Stores routes and descriptors for closing screens.
 */
interface ClosingRouteData {
	route: ComponentRoute;
	descriptor: ComponentStackDescriptorMap[string];
}

const { withComponentNavigationProvider, useComponentNavigationContext } =
	createProvider("ComponentNavigation")<
		ComponentNavigationContextProps,
		ComponentNavigationContextValue
	>((props) => {
		const closingRouteKeys = useClosingRouteKeys();

		// Track previous props - updated during render
		const prevPropsRef = useRef({
			routes: props.state.routes,
			descriptors: props.descriptors,
		});

		// Closing routes data - stored in ref for synchronous access
		const closingDataRef = useRef<Map<string, ClosingRouteData>>(new Map());

		// Counter to force re-renders when closing data changes
		const [, forceUpdate] = useState(0);

		// Synchronously detect route changes during render
		const prevProps = prevPropsRef.current;
		const prevRoutes = prevProps.routes;
		const prevDescriptors = prevProps.descriptors;
		const nextRoutes = props.state.routes;

		// Check if routes actually changed (by key)
		const prevKeys = prevRoutes.map((r) => r.key).join(",");
		const nextKeys = nextRoutes.map((r) => r.key).join(",");

		if (prevKeys !== nextKeys) {
			const previousFocusedRoute = prevRoutes[prevRoutes.length - 1];
			const nextFocusedRoute = nextRoutes[nextRoutes.length - 1];

			if (
				previousFocusedRoute &&
				nextFocusedRoute &&
				previousFocusedRoute.key !== nextFocusedRoute.key
			) {
				const nextRouteWasPresent = prevRoutes.some(
					(r) => r.key === nextFocusedRoute.key,
				);
				const previousRouteStillPresent = nextRoutes.some(
					(r) => r.key === previousFocusedRoute.key,
				);

				if (nextRouteWasPresent && !previousRouteStillPresent) {
					// Going back: previous route was removed, mark as closing
					const descriptor = prevDescriptors[previousFocusedRoute.key];

					if (descriptor && !closingDataRef.current.has(previousFocusedRoute.key)) {
						closingRouteKeys.add(previousFocusedRoute.key);
						closingDataRef.current.set(previousFocusedRoute.key, {
							route: previousFocusedRoute,
							descriptor,
						});
					}
				}
			}
		}

		// Update ref for next render (must be after the check above)
		prevPropsRef.current = {
			routes: props.state.routes,
			descriptors: props.descriptors,
		};

		const handleCloseRoute = useStableCallback(
			({ route }: { route: ComponentRoute }) => {
				closingRouteKeys.remove(route.key);
				if (closingDataRef.current.has(route.key)) {
					closingDataRef.current.delete(route.key);
					forceUpdate((c) => c + 1);
				}
			},
		);

		// Derive routes: props routes + closing routes
		const derivedRoutes = useMemo(() => {
			const routes = [...props.state.routes];
			const propsRouteKeys = new Set(routes.map((r) => r.key));

			// Add closing routes that aren't in props anymore
			for (const [key, data] of closingDataRef.current) {
				if (!propsRouteKeys.has(key)) {
					routes.push(data.route);
				}
			}

			return routes;
		}, [props.state.routes]);

		// Derive descriptors: props descriptors + closing route descriptors
		const derivedDescriptors = useMemo(() => {
			const descriptors: ComponentStackDescriptorMap = { ...props.descriptors };

			// Add closing route descriptors
			for (const [key, data] of closingDataRef.current) {
				if (!descriptors[key]) {
					descriptors[key] = data.descriptor;
				}
			}

			return descriptors;
		}, [props.descriptors]);

		const { scenes, activeScreensLimit, shouldShowFloatOverlay } =
			useMemo(() => {
				const scenes: ComponentStackScene[] = [];
				let shouldShowFloatOverlay = false;

				for (const route of derivedRoutes) {
					const descriptor = derivedDescriptors[route.key];
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
						derivedRoutes,
						derivedDescriptors,
					),
					shouldShowFloatOverlay,
				};
			}, [derivedRoutes, derivedDescriptors]);

		const value = useMemo(
			() => ({
				routes: derivedRoutes,
				focusedIndex: props.state.index,
				descriptors: derivedDescriptors,
				closingRouteKeysShared: closingRouteKeys.shared,
				activeScreensLimit,
				handleCloseRoute,
				scenes,
				shouldShowFloatOverlay,
				navigation: props.navigation,
			}),
			[
				derivedRoutes,
				derivedDescriptors,
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
