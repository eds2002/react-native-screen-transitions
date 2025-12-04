import { useMemo } from "react";
import createProvider from "../../../shared/utils/create-provider";
import type { BlankStackScene } from "../../types";
import { calculateActiveScreensLimit } from "./helpers/calculate-active-screens-limit";
import { useStackNavigationState } from "./hooks/use-stack-navigation-state";
import type {
	StackNavigationContextProps,
	StackNavigationContextValue,
} from "./types";

const { withStackNavigationProvider, useStackNavigationContext } =
	createProvider("StackNavigation")<
		StackNavigationContextProps,
		StackNavigationContextValue
	>((props) => {
		const { state, handleCloseRoute, closingRouteKeys } =
			useStackNavigationState(props);

		const { scenes, activeScreensLimit, shouldShowFloatOverlay } =
			useMemo(() => {
				const scenes: BlankStackScene[] = [];
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

		return {
			value: {
				routes: state.routes,
				focusedIndex: props.state.index,
				descriptors: state.descriptors,
				closingRouteKeysShared: closingRouteKeys.shared,
				activeScreensLimit,
				handleCloseRoute,
				scenes,
				shouldShowFloatOverlay,
			},
		};
	});

export { useStackNavigationContext, withStackNavigationProvider };
