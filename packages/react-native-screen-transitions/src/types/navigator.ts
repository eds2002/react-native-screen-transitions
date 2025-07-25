import type {
	EventListenerCallback,
	ParamListBase,
	RouteProp,
} from "@react-navigation/native";
import type {
	NativeStackNavigationEventMap,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	NativeStackNavigatorProps,
} from "@react-navigation/native-stack";
import type React from "react";
import type { Any, TransitionConfig } from "@/types";

export type TransitionStackNavigationEventMap = NativeStackNavigationEventMap;

export interface TransitionStackNavigationOptions
	extends Omit<NativeStackNavigationOptions, keyof TransitionConfig>,
		TransitionConfig {
	skipDefaultScreenOptions?: boolean;
}

export type TransitionStackNavigationProp<
	ParamList extends ParamListBase,
	RouteName extends keyof ParamList = string,
	NavigatorID extends string | undefined = undefined,
> = NativeStackNavigationProp<ParamList, RouteName, NavigatorID>;

export type TransitionStackNavigatorProps = NativeStackNavigatorProps;

export type TransitionStackScreenOptions<ParamList extends ParamListBase> =
	| TransitionStackNavigationOptions
	| ((props: {
			route: RouteProp<ParamList>;
			navigation: TransitionStackNavigationProp<ParamList>;
	  }) => TransitionStackNavigationOptions);

export type TransitionStackScreenListeners<ParamList extends ParamListBase> =
	| Partial<{
			[EventName in keyof TransitionStackNavigationEventMap]: EventListenerCallback<
				TransitionStackNavigationEventMap,
				EventName
			>;
	  }>
	| ((props: {
			route: RouteProp<ParamList>;
			navigation: TransitionStackNavigationProp<ParamList>;
	  }) => Partial<{
			[EventName in keyof TransitionStackNavigationEventMap]: EventListenerCallback<
				TransitionStackNavigationEventMap,
				EventName
			>;
	  }>);

export interface TransitionStackScreenProps<ParamList extends ParamListBase> {
	name: string;
	component: React.ComponentType<Any>;
	options?: TransitionStackScreenOptions<ParamList>;
	listeners?: TransitionStackScreenListeners<ParamList>;
	initialParams?: ParamList[keyof ParamList];
	[key: string]: Any;
}
