import {
	createStandardNavigationFactories,
	type NavigatorTypeBagBase,
	type ParamListBase,
	type StackActionHelpers,
	type StackNavigationState,
	StackRouter,
	type StackRouterOptions,
	type StandardNavigationTypeBagBase,
	type StaticConfig,
	type TypedNavigator,
} from "@react-navigation/native";
import type * as React from "react";
import type {
	BlankStackNavigationEventMap,
	BlankStackNavigationOptions,
	BlankStackNavigationProp,
	BlankStackNavigatorProps,
} from "../../../blank-stack/types";
import { reactNavigationHost } from "../../providers/navigation/react-navigation-host";
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

type BlankStackTypeBagFor<
	ParamList extends ParamListBase,
	NavigatorID extends string | undefined,
> = NavigatorTypeBagBase & {
	ParamList: ParamList;
	NavigatorID: NavigatorID;
	State: StackNavigationState<ParamList>;
	ScreenOptions: BlankStackNavigationOptions;
	EventMap: BlankStackNavigationEventMap;
	NavigationList: {
		[RouteName in keyof ParamList]: BlankStackNavigationProp<
			ParamList,
			RouteName,
			NavigatorID
		>;
	};
	Navigator: React.ComponentType<BlankStackNavigatorProps>;
};

const standardBlankStackFactories = createStandardNavigationFactories<
	BlankStackStandardTypeBag,
	BlankStackStandardNavigatorProps
>(BlankStackNavigator, StackRouter, ({ state, navigation }) => ({
	navigationState: state,
	navigation,
	navigationHost: reactNavigationHost,
}));

export const createBlankStackScreen = standardBlankStackFactories.createScreen;

const createReactNavigationBlankStackNavigator =
	standardBlankStackFactories.createNavigator as unknown as (
		config?: unknown,
	) => unknown;

export function createBlankStackNavigator<
	const ParamList extends ParamListBase = ParamListBase,
	const NavigatorID extends string | undefined = undefined,
	const TypeBag extends NavigatorTypeBagBase = BlankStackTypeBagFor<
		ParamList,
		NavigatorID
	>,
	const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
	return createReactNavigationBlankStackNavigator(
		config,
	) as unknown as TypedNavigator<TypeBag, Config>;
}

export type {
	BlankStackFactoryOptions,
	BlankStackNavigationEventMap,
	BlankStackNavigationOptions,
	BlankStackNavigationProp,
	BlankStackNavigatorProps,
	BlankStackOptionsArgs,
	BlankStackOverlayProps,
	BlankStackScreenProps,
	InactiveBehavior,
} from "../../../blank-stack/types";
