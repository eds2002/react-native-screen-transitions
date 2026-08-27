import {
	type StackNavigationState,
	StackRouter,
	type StackRouterOptions,
	unstable_integrateWithRouter,
} from "expo-router";
import type { BlankStackNavigationOptions } from "../../types/blank-stack.types";
import {
	BlankStackNavigator,
	type BlankStackStandardEventMap,
	type BlankStackStandardNavigatorProps,
} from "../create-blank-stack-navigator";

type BlankStackExpoRouterParamList = Record<string, object | undefined>;

export const BlankStack = unstable_integrateWithRouter<
	BlankStackNavigationOptions,
	StackNavigationState<BlankStackExpoRouterParamList>,
	BlankStackStandardEventMap,
	BlankStackStandardNavigatorProps,
	StackRouterOptions
>(BlankStackNavigator, StackRouter, {
	createProps: ({ state, navigation }) => ({
		navigationState: state,
		navigation,
	}),
});

export const BlankStackScreen = BlankStack.Screen;

export type {
	BlankStackNavigationEventMap,
	BlankStackNavigationOptions,
	BlankStackNavigationProp,
	BlankStackNavigatorProps,
	BlankStackOptionsArgs,
	BlankStackOverlayProps,
	BlankStackScreenProps,
	InactiveBehavior,
} from "../../types/blank-stack.types";
