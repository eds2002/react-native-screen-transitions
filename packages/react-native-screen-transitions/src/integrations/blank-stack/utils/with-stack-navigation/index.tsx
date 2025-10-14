import {
  type ComponentType,
  createContext,
  memo,
  useContext,
  useMemo,
} from "react";
import { Header } from "../../components/Header";
import type { BlankStackScene } from "../../../../types/blank-stack.navigator";
import { useStackNavigationState } from "./_hooks/use-stack-navigation-state";
import type {
  StackNavigationContextProps,
  StackNavigationContextValue,
} from "./_types";
import { calculateActiveScreensLimit } from "./_utils/calculateActiveScreensLimit";

export const StackNavigationContext =
  createContext<StackNavigationContextValue | null>(null);

export function withStackNavigationProvider(
  Component: ComponentType<StackNavigationContextValue>
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

    const FloatHeader = memo(() => {
      const shouldShowFloatHeader = props.state.routes.some((route) => {
        const options = props.descriptors[route.key]?.options;
        return options?.headerMode === "float" && options?.headerShown;
      });

      if (!shouldShowFloatHeader) {
        return null;
      }

      return <Header.Float />;
    });

    const contextValue = useMemo<StackNavigationContextValue>(() => {
      return {
        routes: state.routes,
        focusedIndex: props.state.index,
        descriptors: state.descriptors,
        closingRouteKeysShared: closingRouteKeys.shared,
        activeScreensLimit,
        handleCloseRoute,
        scenes,
        FloatHeader,
      };
    }, [
      state,
      scenes,
      activeScreensLimit,
      closingRouteKeys,
      handleCloseRoute,
      props.state.index,
      FloatHeader,
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
      "StackNavigationContext.Provider is missing in the component tree."
    );
  }

  return context;
};
