import type {
  ParamListBase,
  StackNavigationState,
} from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import {
  createBlankStackNavigator,
  type BlankStackNavigationEventMap,
  type BlankStackNavigationOptions,
} from "react-native-screen-transitions";

const { Navigator } = createBlankStackNavigator();

export const BlankStack = withLayoutContext<
  BlankStackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  BlankStackNavigationEventMap
>(Navigator);
