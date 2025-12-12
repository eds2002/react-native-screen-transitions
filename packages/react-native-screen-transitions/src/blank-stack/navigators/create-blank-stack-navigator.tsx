import {
	createNavigatorFactory,
	type EventArg,
	type NavigatorTypeBagBase,
	type ParamListBase,
	type StackActionHelpers,
	StackActions,
	type StackNavigationState,
	StackRouter,
	type StackRouterOptions,
	type StaticConfig,
	type TypedNavigator,
	useNavigationBuilder,
} from "@react-navigation/native";
import * as React from "react";
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

	React.useEffect(
		() =>
			// @ts-expect-error: there may not be a tab navigator in parent
			navigation?.addListener?.("tabPress", (e: any) => {
				const isFocused = navigation.isFocused();

				// Run the operation in the next frame so we're sure all listeners have been run
				// This is necessary to know if preventDefault() has been called
				requestAnimationFrame(() => {
					if (
						state.index > 0 &&
						isFocused &&
						!(e as EventArg<"tabPress", true>).defaultPrevented
					) {
						// When user taps on already focused tab and we're inside the tab,
						// reset the stack to replicate native behaviour
						navigation.dispatch({
							...StackActions.popToTop(),
							target: state.key,
						});
					}
				});
			}),
		[navigation, state.index, state.key],
	);

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
