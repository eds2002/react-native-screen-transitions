import "react-native-reanimated";
import type {
	ParamListBase,
	StackNavigationState,
} from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import {
	type BlankStackNavigationEventMap,
	type BlankStackNavigationOptions,
	createBlankStackNavigator,
} from "react-native-screen-transitions/blank-stack";

const { Navigator } = createBlankStackNavigator();

export const BlankStack = withLayoutContext<
	BlankStackNavigationOptions,
	typeof Navigator,
	StackNavigationState<ParamListBase>,
	BlankStackNavigationEventMap
>(Navigator);
