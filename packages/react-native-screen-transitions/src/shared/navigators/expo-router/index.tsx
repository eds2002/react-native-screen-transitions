import {
	type StackNavigationState,
	StackRouter,
	type StackRouterOptions,
	unstable_integrateWithRouter,
} from "expo-router";
import {
	NavigationContext,
	NavigationRouteContext,
} from "expo-router/react-navigation";
import type { BlankStackNavigationOptions } from "../../../blank-stack/types";
import type { NavigationScreenProviderComponent } from "../../providers/navigation/navigation-host.provider";
import {
	BlankStackNavigator,
	type BlankStackStandardEventMap,
	type BlankStackStandardNavigatorProps,
} from "../create-blank-stack-navigator";

type BlankStackExpoRouterParamList = Record<string, object | undefined>;

const ExpoRouterScreenProvider: NavigationScreenProviderComponent = ({
	children,
	navigation,
	route,
}) => (
	<NavigationContext.Provider value={navigation as never}>
		<NavigationRouteContext.Provider value={route as never}>
			{children}
		</NavigationRouteContext.Provider>
	</NavigationContext.Provider>
);

const expoRouterNavigationHost = {
	ScreenProvider: ExpoRouterScreenProvider,
};

export const BlankStack = unstable_integrateWithRouter<
	BlankStackNavigationOptions,
	StackNavigationState<BlankStackExpoRouterParamList>,
	BlankStackStandardEventMap,
	BlankStackStandardNavigatorProps,
	StackRouterOptions
>(BlankStackNavigator, StackRouter, {
	createProps: ({ state, navigation }) => ({
		navigationState: state,
		navigation,
		navigationHost: expoRouterNavigationHost,
	}),
});

export const BlankStackScreen = BlankStack.Screen;

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
