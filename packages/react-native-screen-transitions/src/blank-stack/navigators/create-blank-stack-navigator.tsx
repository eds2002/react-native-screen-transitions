import {
	createNavigatorFactory,
	NavigationContainer,
	NavigationIndependentTree,
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
import * as React from "react";
import { useTabPressReset } from "../../shared/hooks/navigation/use-tab-press-reset";
import { StackView } from "../components/stack-view";
import type {
	BlankStackFactoryOptions,
	BlankStackNavigationEventMap,
	BlankStackNavigationOptions,
	BlankStackNavigationProp,
	BlankStackNavigatorProps,
} from "../types";

type BlankStackNavigatorInnerProps = Omit<
	BlankStackNavigatorProps,
	keyof BlankStackFactoryOptions
>;

const BlankStackContext = React.createContext<boolean>(false);
BlankStackContext.displayName = "BlankStackContext";

function BlankStackNavigatorInner({
	id,
	initialRouteName,
	children,
	layout,
	screenListeners,
	screenOptions,
	screenLayout,
	...rest
}: BlankStackNavigatorInnerProps) {
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

function BlankStackNavigator({
	independent = false,
	...rest
}: BlankStackNavigatorProps) {
	const isNested = React.useContext(BlankStackContext);

	const navigator = <BlankStackNavigatorInner {...rest} />;

	if (!independent || isNested) {
		return navigator;
	}

	return (
		<NavigationIndependentTree>
			<NavigationContainer>
				<BlankStackContext.Provider value={true}>
					{navigator}
				</BlankStackContext.Provider>
			</NavigationContainer>
		</NavigationIndependentTree>
	);
}

BlankStackNavigator.displayName = "BlankStackNavigator";

type BlankStackTypeBag<
	ParamList extends ParamListBase,
	NavigatorID extends string | undefined,
> = {
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
};

/**
 * Creates a blank stack navigator with gesture-driven transitions.
 *
 * By default, blank stack behaves like the existing top-level blank stack:
 * it participates in the current navigation tree and renders with the shared
 * view-based screen host.
 *
 * Blank stack also accepts navigator-specific props for embedded-flow behavior:
 * - `independent: true` creates an isolated navigator for nested flows
 *
 * In the dynamic API, pass these to `<Stack.Navigator />`.
 * In the static API, pass them in the same config object as `screens`.
 */
export function createBlankStackNavigator<
	const ParamList extends ParamListBase,
	const NavigatorID extends string | undefined = undefined,
	const TypeBag extends NavigatorTypeBagBase = BlankStackTypeBag<
		ParamList,
		NavigatorID
	>,
	const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
	return createNavigatorFactory(BlankStackNavigator)(config);
}
