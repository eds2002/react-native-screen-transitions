import type {
  NavigationRoute,
  ParamListBase,
  Route,
  RouteProp,
  StackNavigationState,
} from "@react-navigation/native";
import type React from "react";
import type { SharedValue } from "react-native-reanimated";
import type {
  BlankStackDescriptor,
  BlankStackDescriptorMap,
  BlankStackNavigationHelpers,
  BlankStackScene,
} from "../../../../types/blank-stack.navigator";

export interface StackNavigationContextValue {
  routes: NavigationRoute<ParamListBase, string>[];
  descriptors: BlankStackDescriptorMap;
  scenes: BlankStackScene[];
  activeScreensLimit: number;
  closingRouteKeysShared: SharedValue<string[]>;
  handleCloseRoute: (payload: { route: Route<string> }) => void;
  FloatHeader: React.MemoExoticComponent<() => React.JSX.Element | null>;
  focusedIndex: number;
}

export interface StackNavigationContextProps {
  state: StackNavigationState<ParamListBase>;
  navigation: BlankStackNavigationHelpers;
  descriptors: BlankStackDescriptorMap;
  describe: (
    route: RouteProp<ParamListBase>,
    placeholder: boolean
  ) => BlankStackDescriptor;
}
