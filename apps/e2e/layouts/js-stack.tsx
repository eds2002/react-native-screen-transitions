import "react-native-reanimated";
import type {
	ParamListBase,
	StackNavigationState,
} from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import {
	createStackNavigator,
	type StackNavigationEventMap,
	type StackNavigationOptions,
} from "@react-navigation/stack";

const { Navigator } = createStackNavigator();

export const JsStack = withLayoutContext<
	StackNavigationOptions,
	typeof Navigator,
	StackNavigationState<ParamListBase>,
	StackNavigationEventMap
>(Navigator);
