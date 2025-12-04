import { type ComponentType, createContext, useContext, useMemo } from "react";
import type { BlankStackScene } from "../../types";
import { calculateActiveScreensLimit } from "./helpers/calculate-active-screens-limit";
import { useStackNavigationState } from "./hooks/use-stack-navigation-state";
import type {
	StackNavigationContextProps,
	StackNavigationContextValue,
} from "./types";

export const StackNavigationContext =
	createContext<StackNavigationContextValue | null>(null);

export function withStackNavigationProvider(
	Component: ComponentType<StackNavigationContextValue>,
) {
	return function StackNavigationWrapper(props: StackNavigationContextProps) {
		const { state, handleCloseRoute, closingRouteKeys } =
			useStackNavigationState(props);

		const { scenes, activeScreensLimit, shouldShowFloatOverlay } = useMemo(() => {
			const scenes: BlankStackScene[] = [];
			let shouldShowFloatOverlay = false;

			for (const route of state.routes) {
				const descriptor = state.descriptors[route.key];
				scenes.push({ route, descriptor });

				if (!shouldShowFloatOverlay) {
					const options = descriptor?.options;
					shouldShowFloatOverlay =
						options?.overlayMode === "float" && options?.overlayShown === true;
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

		const contextValue = useMemo<StackNavigationContextValue>(() => {
			return {
				routes: state.routes,
				focusedIndex: props.state.index,
				descriptors: state.descriptors,
				closingRouteKeysShared: closingRouteKeys.shared,
				activeScreensLimit,
				handleCloseRoute,
				scenes,
				shouldShowFloatOverlay,
			};
		}, [
			state,
			scenes,
			activeScreensLimit,
			closingRouteKeys,
			handleCloseRoute,
			props.state.index,
			shouldShowFloatOverlay,
		]);

		return (
			<StackNavigationContext.Provider value={contextValue}>
				<Component {...contextValue} />
			</StackNavigationContext.Provider>
		);
	};
}

export const useStackNavigationContext = () => {
	const context = useContext(StackNavigationContext);

	if (!context) {
		throw new Error(
			"StackNavigationContext.Provider is missing in the component tree.",
		);
	}

	return context;
};
