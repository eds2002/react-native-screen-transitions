import {
	createStandardNavigationFactories,
	type StackActionHelpers,
	type StackNavigationState,
	StackRouter,
	type StackRouterOptions,
	type StandardNavigationTypeBagBase,
} from "@react-navigation/native";
import type {
	BlankStackNavigationEventMap,
	BlankStackNavigationOptions,
} from "../../types/blank-stack.types";
import {
	BlankStackNavigator,
	type BlankStackStandardNavigatorProps,
} from "../create-blank-stack-navigator";

interface BlankStackStandardTypeBag extends StandardNavigationTypeBagBase {
	State: StackNavigationState<this["ParamList"]>;
	ActionHelpers: StackActionHelpers<this["ParamList"]>;
	ScreenOptions: BlankStackNavigationOptions;
	EventMap: BlankStackNavigationEventMap;
	RouterOptions: StackRouterOptions;
}

export const {
	createNavigator: createBlankStackNavigator,
	createScreen: createBlankStackScreen,
} = createStandardNavigationFactories<
	BlankStackStandardTypeBag,
	BlankStackStandardNavigatorProps
>(BlankStackNavigator, StackRouter, ({ state, navigation }) => ({
	navigationState: state,
	navigation,
}));

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
