import {
	type IntegrateWithRouterOptions,
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
import { createBlankStackProps } from "./create-blank-stack-props";

type BlankStackExpoRouterParamList = Record<string, object | undefined>;

type BlankStackExpoRouterState =
	StackNavigationState<BlankStackExpoRouterParamList>;

// Expo Router 57+ adds a sixth type argument for `createProps` that 56 rejects,
// so the options are checked with `satisfies` and cast to fit every version.
export const BlankStack = unstable_integrateWithRouter<
	BlankStackNavigationOptions,
	BlankStackExpoRouterState,
	BlankStackStandardEventMap,
	BlankStackStandardNavigatorProps,
	StackRouterOptions
>(BlankStackNavigator, StackRouter, {
	createProps: createBlankStackProps,
} satisfies IntegrateWithRouterOptions<
	BlankStackExpoRouterState,
	BlankStackStandardNavigatorProps
> as never);

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
