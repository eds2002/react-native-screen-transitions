import { useMemo } from "react";
import createProvider from "../../../shared/utils/create-provider";
import type {
	ComponentRoute,
	ComponentStackDescriptorMap,
	ComponentStackScene,
} from "../../types";
import { useComponentNavigationState } from "./hooks/use-component-navigation-state";
import type {
	ComponentNavigationContextProps,
	ComponentNavigationContextValue,
} from "./types";

/**
 * Calculate active screens limit based on screen options.
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
		const { state, handleCloseRoute, closingRouteKeys } =
			useComponentNavigationState(props);

		const { scenes, activeScreensLimit, shouldShowFloatOverlay } =
			useMemo(() => {
				const scenes: ComponentStackScene[] = [];
				let shouldShowFloatOverlay = false;

				for (const route of state.routes) {
					const descriptor = state.descriptors[route.key];
					scenes.push({ route, descriptor });

					if (!shouldShowFloatOverlay) {
						const options = descriptor?.options;
						shouldShowFloatOverlay =
							options?.overlayMode === "float" &&
							options?.overlayShown === true;
					}
				}

				return {
					scenes,
					activeScreensLimit: calculateActiveScreensLimit(
						state.routes,
						state.descriptors,
					),
					shouldShowFloatOverlay,
				};
			}, [state.routes, state.descriptors]);

		const value = useMemo(
			() => ({
				routes: state.routes,
				focusedIndex: props.state.index,
				descriptors: state.descriptors,
				closingRouteKeysShared: closingRouteKeys.shared,
				activeScreensLimit,
				handleCloseRoute,
				scenes,
				shouldShowFloatOverlay,
				navigation: props.navigation,
			}),
			[
				state.routes,
				state.descriptors,
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
