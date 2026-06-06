import "react-native-reanimated";
import type {
	ParamListBase,
	StackNavigationState,
} from "@react-navigation/native";
import {
	createNativeStackNavigator,
	type NativeStackNavigationEventMap,
	type NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { withLayoutContext } from "expo-router";
import {
	type NativeStackAdapterOptions as ScreenTransitionsNativeStackAdapterOptions,
	withScreenTransitions,
} from "react-native-screen-transitions";

type NativeStackAdapterOptions =
	ScreenTransitionsNativeStackAdapterOptions<NativeStackNavigationOptions>;

const NativeStack = withScreenTransitions(createNativeStackNavigator());
const { Navigator } = NativeStack;

export const NativeStackAdapter = withLayoutContext<
	NativeStackAdapterOptions,
	typeof Navigator,
	StackNavigationState<ParamListBase>,
	NativeStackNavigationEventMap
>(Navigator);
