import * as ExpoRouter from "expo-router";
import {
	type IntegrateWithRouterOptions,
	type StackNavigationState,
	StackRouter,
	type StackRouterOptions,
} from "expo-router";
import type { BlankStackNavigationOptions } from "../../types/blank-stack.types";
import {
	BlankStackNavigator,
	type BlankStackStandardEventMap,
	type BlankStackStandardNavigatorProps,
} from "../blank-stack/create-blank-stack-navigator";

type BlankStackExpoRouterParamList = Record<string, object | undefined>;

type BlankStackExpoRouterState =
	StackNavigationState<BlankStackExpoRouterParamList>;

type ExpoRouterExports = typeof ExpoRouter;

// Expo Router 58 ships the stable `integrateWithRouter` and keeps `unstable_integrateWithRouter`
// as a deprecated alias of the same function; 56 and 57 only have the unstable name. Read the
// exports by name so this file typechecks and runs on each of them.
type IntegrateWithRouter = ExpoRouterExports extends {
	integrateWithRouter: infer Integrate;
}
	? Integrate
	: ExpoRouterExports extends { unstable_integrateWithRouter: infer Integrate }
		? Integrate
		: never;

const routerExports = ExpoRouter as Partial<
	Record<
		"integrateWithRouter" | "unstable_integrateWithRouter",
		IntegrateWithRouter
	>
>;

const integrateWithRouter = (routerExports.integrateWithRouter ??
	routerExports.unstable_integrateWithRouter) as IntegrateWithRouter;

// Expo Router 57+ adds a sixth type argument for `createProps` that 56 rejects,
// so the options are checked with `satisfies` and cast to fit every version.
export const BlankStack = integrateWithRouter<
	BlankStackNavigationOptions,
	BlankStackExpoRouterState,
	BlankStackStandardEventMap,
	BlankStackStandardNavigatorProps,
	StackRouterOptions
>(BlankStackNavigator, StackRouter, {
	createProps: ({ state, navigation }) => ({
		navigationState: state,
		navigation,
	}),
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
