import {
	createNavigatorFactory,
	type NavigatorTypeBagBase,
	type ParamListBase,
	type StackNavigationState,
	StackRouter,
	type StackRouterOptions,
	type TypedNavigator,
	useNavigationBuilder,
} from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { Any } from "@/types";
import { AwareNativeStackView } from "./components/aware-native-stack-view.native";
import { useModifyChildren } from "./hooks/use-modify-children";
import type {
	AwareNativeStackActionHelpers,
	AwareNativeStackNavigationEventMap,
	AwareNativeStackNavigationOptions,
	AwareNativeStackNavigationState,
	AwareNativeStackNavigatorProps,
	AwareNavigationProp,
} from "./types";

function TransitionableStackNavigator({
	id,
	initialRouteName,
	children: baseChildren,
	layout,
	screenListeners,
	screenOptions,
	screenLayout,
	UNSTABLE_router,
	...rest
}: AwareNativeStackNavigatorProps) {
	const { children } = useModifyChildren(baseChildren);

	const { state, describe, descriptors, navigation, NavigationContent } =
		useNavigationBuilder<
			AwareNativeStackNavigationState,
			StackRouterOptions,
			AwareNativeStackActionHelpers,
			NativeStackNavigationOptions,
			AwareNativeStackNavigationEventMap
		>(StackRouter, {
			id,
			initialRouteName,
			children,
			layout,
			screenListeners,
			screenOptions,
			screenLayout,
			UNSTABLE_router,
		});

	return (
		<NavigationContent>
			<AwareNativeStackView
				{...rest}
				state={state}
				navigation={navigation as Any}
				descriptors={descriptors as Any}
				describe={describe as Any}
			/>
		</NavigationContent>
	);
}

export function createTransitionableStackNavigator<
	const ParamList extends ParamListBase,
	const NavigatorID extends string | undefined = undefined,
	const TypeBag extends NavigatorTypeBagBase = {
		ParamList: ParamList;
		NavigatorID: NavigatorID;
		State: StackNavigationState<ParamList>;
		ScreenOptions: AwareNativeStackNavigationOptions;
		EventMap: AwareNativeStackNavigationEventMap;
		NavigationList: {
			[RouteName in keyof ParamList]: AwareNavigationProp<
				ParamList,
				RouteName,
				NavigatorID
			>;
		};
		Navigator: typeof TransitionableStackNavigator;
	},
>(): TypedNavigator<TypeBag> {
	return createNavigatorFactory(TransitionableStackNavigator)();
}

export type TransitionStackNavigatorTypeBag<
	ScreenOptions = AwareNativeStackNavigationOptions,
	State = StackNavigationState<ParamListBase>,
	EventMap = AwareNativeStackNavigationEventMap,
> = {
	ScreenOptions: ScreenOptions;
	State: State;
	EventMap: EventMap;
};
