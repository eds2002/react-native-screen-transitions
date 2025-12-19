import {
	createNavigatorFactory,
	type NavigatorTypeBagBase,
	type ParamListBase,
	type StackActionHelpers,
	type StackNavigationState,
	StackRouter,
	type StackRouterOptions,
	type StaticConfig,
	type TypedNavigator,
	useNavigationBuilder,
} from "@react-navigation/native";
import { StackView } from "../components/stack-view";
import type {
	ComponentStackNavigationEventMap,
	ComponentStackNavigationOptions,
	ComponentStackNavigationProp,
	ComponentStackNavigatorProps,
} from "../types";

function ComponentStackNavigator({
	id,
	initialRouteName,
	children,
	layout,
	screenListeners,
	screenOptions,
	screenLayout,
	...rest
}: ComponentStackNavigatorProps) {
	const { state, describe, descriptors, navigation, NavigationContent } =
		useNavigationBuilder<
			StackNavigationState<ParamListBase>,
			StackRouterOptions,
			StackActionHelpers<ParamListBase>,
			ComponentStackNavigationOptions,
			ComponentStackNavigationEventMap
		>(StackRouter, {
			id,
			initialRouteName,
			children,
			layout,
			screenListeners,
			screenOptions,
			screenLayout,
		});

	return (
		<NavigationContent>
			<StackView
				{...rest}
				state={state}
				navigation={navigation}
				descriptors={descriptors}
				describe={describe}
			/>
		</NavigationContent>
	);
}

export function createComponentStackNavigator<
	const ParamList extends ParamListBase,
	const NavigatorID extends string | undefined = undefined,
	const TypeBag extends NavigatorTypeBagBase = {
		ParamList: ParamList;
		NavigatorID: NavigatorID;
		State: StackNavigationState<ParamList>;
		ScreenOptions: ComponentStackNavigationOptions;
		EventMap: ComponentStackNavigationEventMap;
		NavigationList: {
			[RouteName in keyof ParamList]: ComponentStackNavigationProp<
				ParamList,
				RouteName,
				NavigatorID
			>;
		};
		Navigator: typeof ComponentStackNavigator;
	},
	const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
	return createNavigatorFactory(ComponentStackNavigator)(config);
}
