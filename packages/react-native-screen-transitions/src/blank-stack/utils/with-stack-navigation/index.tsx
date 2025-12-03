import { type ComponentType, createContext, useContext, useMemo } from "react";
import type { BlankStackScene } from "../../types";
import { useStackNavigationState } from "./hooks/use-stack-navigation-state";
import type {
	StackNavigationContextProps,
	StackNavigationContextValue,
} from "./_types";
import { calculateActiveScreensLimit } from "./helpers/calculate-active-screens-limit";

export const StackNavigationContext =
	createContext<StackNavigationContextValue | null>(null);

export function withStackNavigationProvider(
	Component: ComponentType<StackNavigationContextValue>,
) {
	return function StackNavigationWrapper(props: StackNavigationContextProps) {
		const { state, handleCloseRoute, closingRouteKeys } =
			useStackNavigationState(props);

		const scenes = useMemo(() => {
			return state.routes.reduce((acc, route) => {
				acc.push({
					route,
					descriptor: state.descriptors[route.key],
				});
				return acc;
			}, [] as BlankStackScene[]);
		}, [state.routes, state.descriptors]);

		const activeScreensLimit = useMemo(() => {
			return calculateActiveScreensLimit(state.routes, state.descriptors);
		}, [state.routes, state.descriptors]);

		const shouldShowFloatOverlay = useMemo(() => {
			return state.routes.some((route) => {
				const options = state.descriptors[route.key]?.options;
				return options?.overlayMode === "float" && options?.overlayShown;
			});
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
