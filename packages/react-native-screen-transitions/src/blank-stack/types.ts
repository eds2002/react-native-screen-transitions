import type {
	DefaultNavigatorOptions,
	Descriptor,
	NavigationHelpers,
	NavigationProp,
	ParamListBase,
	Route,
	RouteProp,
	StackActionHelpers,
	StackNavigationState,
	StackRouterOptions,
	Theme,
} from "@react-navigation/native";
import type { OverlayProps, ScreenTransitionConfig } from "../shared";

export type BlankStackNavigationEventMap = {};

export type BlankStackNavigationProp<
	ParamList extends ParamListBase,
	RouteName extends keyof ParamList = string,
	NavigatorID extends string | undefined = undefined,
> = NavigationProp<
	ParamList,
	RouteName,
	NavigatorID,
	StackNavigationState<ParamList>,
	BlankStackNavigationOptions,
	BlankStackNavigationEventMap
> &
	StackActionHelpers<ParamList>;

export type BlankStackScreenProps<
	ParamList extends ParamListBase,
	RouteName extends keyof ParamList = string,
	NavigatorID extends string | undefined = undefined,
> = {
	navigation: BlankStackNavigationProp<ParamList, RouteName, NavigatorID>;
	route: RouteProp<ParamList, RouteName>;
};

export type BlankStackOptionsArgs<
	ParamList extends ParamListBase,
	RouteName extends keyof ParamList = keyof ParamList,
	NavigatorID extends string | undefined = undefined,
> = BlankStackScreenProps<ParamList, RouteName, NavigatorID> & {
	theme: Theme;
};

export type BlankStackNavigationHelpers = NavigationHelpers<
	ParamListBase,
	BlankStackNavigationEventMap
>;

export type BlankStackScene = {
	route: Route<string>;
	descriptor: BlankStackDescriptor;
};

// We want it to be an empty object because navigator does not have any additional props
type BlankStackNavigationConfig = {};

/**
 * Props passed to overlay components in blank-stack.
 * Uses the shared OverlayProps type with blank-stack's navigation type.
 */
export type BlankStackOverlayProps = OverlayProps<
	BlankStackNavigationProp<ParamListBase>
>;

type BlankStackScreenTransitionConfig = ScreenTransitionConfig & {
	/**
	 * Whether to detach the previous screen from the view hierarchy to save memory.
	 * Set it to `false` if you need the previous screen to be seen through the active screen.
	 * Only applicable if `detachInactiveScreens` isn't set to `false`.
	 */
	detachPreviousScreen?: boolean;
};

export type BlankStackNavigationOptions = BlankStackScreenTransitionConfig & {
	/**
	 * Whether inactive screens should be suspended from re-rendering. Defaults to `false`.
	 * Defaults to `true` when `enableFreeze()` is run at the top of the application.
	 * Requires `react-native-screens` version >=3.16.0.
	 *
	 * Only supported on iOS and Android.
	 */
	freezeOnBlur?: boolean;
};

export type BlankStackNavigatorProps = DefaultNavigatorOptions<
	ParamListBase,
	string | undefined,
	StackNavigationState<ParamListBase>,
	BlankStackNavigationOptions,
	BlankStackNavigationEventMap,
	BlankStackNavigationProp<ParamListBase>
> &
	StackRouterOptions &
	BlankStackNavigationConfig;

export type BlankStackDescriptor = Descriptor<
	BlankStackNavigationOptions,
	BlankStackNavigationProp<ParamListBase>,
	RouteProp<ParamListBase>
>;

export type BlankStackDescriptorMap = {
	[key: string]: BlankStackDescriptor;
};
