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
import { StackView } from "../components/stack-view";
import type {
	ComponentStackNavigationEventMap,
	ComponentStackNavigationOptions,
	ComponentStackNavigationProp,
	ComponentStackNavigatorProps,
} from "../types";

/**
 * Context to detect if we're inside a ComponentStack.
 * Used to avoid double-wrapping nested ComponentStacks in NavigationIndependentTree.
 */
const ComponentStackContext = React.createContext<boolean>(false);
ComponentStackContext.displayName = "ComponentStackContext";

const ComponentStackNavigatorInner = React.memo(
	function ComponentStackNavigatorInner({
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
	},
);

/**
 * ComponentStackNavigator conditionally wraps in NavigationIndependentTree.
 * - If already inside a ComponentStack (nested), just render the inner navigator
 *   so it participates in the parent's navigation tree and goBack() works.
 * - If top-level, wrap in NavigationIndependentTree + NavigationContainer
 *   to isolate from Expo Router / React Navigation.
 */
function IsolatedComponentStackNavigator(props: ComponentStackNavigatorProps) {
	const isNested = React.useContext(ComponentStackContext);

	if (isNested) {
		return <ComponentStackNavigatorInner {...props} />;
	}

	return (
		<NavigationIndependentTree>
			<NavigationContainer>
				<ComponentStackContext.Provider value={true}>
					<ComponentStackNavigatorInner {...props} />
				</ComponentStackContext.Provider>
			</NavigationContainer>
		</NavigationIndependentTree>
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
		Navigator: typeof IsolatedComponentStackNavigator;
	},
	const Config extends StaticConfig<TypeBag> = StaticConfig<TypeBag>,
>(config?: Config): TypedNavigator<TypeBag, Config> {
	return createNavigatorFactory(IsolatedComponentStackNavigator)(config);
}
