import "react-native-reanimated";
import type {
	ParamListBase,
	StackNavigationState,
} from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import {
	createNativeStackNavigator,
	type NativeStackNavigationEventMap,
	type NativeStackNavigationOptions,
} from "react-native-screen-transitions";

const { Navigator } = createNativeStackNavigator();

export const Stack = withLayoutContext<
	NativeStackNavigationOptions,
	typeof Navigator,
	StackNavigationState<ParamListBase>,
	NativeStackNavigationEventMap
>(Navigator);
