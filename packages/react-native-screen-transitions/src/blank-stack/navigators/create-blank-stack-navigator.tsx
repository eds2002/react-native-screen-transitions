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
import { useTabPressReset } from "../../shared/hooks/navigation/use-tab-press-reset";
import { StackView } from "../components/stack-view";
import type {
	BlankStackNavigationEventMap,
	BlankStackNavigationOptions,
	BlankStackNavigationProp,
	BlankStackNavigatorProps,
} from "../types";

function BlankStackNavigator({
	id,
	initialRouteName,
	children,
	layout,
	screenListeners,
	screenOptions,
	screenLayout,
	...rest
}: BlankStackNavigatorProps) {
	const { state, describe, descriptors, navigation, NavigationContent } =
		useNavigationBuilder<
			StackNavigationState<ParamListBase>,
			StackRouterOptions,
			StackActionHelpers<ParamListBase>,
			BlankStackNavigationOptions,
			BlankStackNavigationEventMap
		>(StackRouter, {
			id,
			initialRouteName,
			children,
			layout,
			screenListeners,
			screenOptions,
			screenLayout,
		});

	useTabPressReset(navigation, state.index, state.key);

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

export function createBlankStackNavigator<
	const ParamList extends ParamListBase,
	const NavigatorID extends string | undefined = undefined,
	const TypeBag extends NavigatorTypeBagBase = {
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
		Navigator: typeof BlankStackNavigator;
	},
	const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
	return createNavigatorFactory(BlankStackNavigator)(config);
}
