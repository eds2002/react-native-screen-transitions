import type {
  NavigationRoute,
  ParamListBase,
  Route,
  RouteProp,
  StackNavigationState,
} from "@react-navigation/native";
import type { SharedValue } from "react-native-reanimated";
import type {
  BlankStackDescriptor,
  BlankStackDescriptorMap,
  BlankStackNavigationHelpers,
  BlankStackScene,
} from "../../types";

export interface StackNavigationContextValue {
  routes: NavigationRoute<ParamListBase, string>[];
  descriptors: BlankStackDescriptorMap;
  scenes: BlankStackScene[];
  activeScreensLimit: number;
  closingRouteKeysShared: SharedValue<string[]>;
  markRouteClosingFinished: (routeKey: string) => void;
  handleCloseRoute: (payload: { route: Route<string> }) => void;
  shouldShowFloatHeader: boolean;
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
