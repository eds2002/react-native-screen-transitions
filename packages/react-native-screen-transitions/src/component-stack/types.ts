import type {
	DefaultNavigatorOptions,
	Descriptor,
	NavigationHelpers,
	NavigationProp,
	ParamListBase,
	RouteProp,
	StackActionHelpers,
	StackNavigationState,
	StackRouterOptions,
	Theme,
} from "@react-navigation/native";
import type { ScreenTransitionConfig } from "../shared";
import type { OverlayProps } from "../shared/types/overlay.types";

/**
 * @deprecated Component stack is deprecated. Use blank stack instead.
 */
export type ComponentStackNavigationEventMap = {};

/**
 * @deprecated Component stack is deprecated. Use blank stack instead.
 */
export type ComponentStackNavigationProp<
	ParamList extends ParamListBase,
	RouteName extends keyof ParamList = string,
	NavigatorID extends string | undefined = undefined,
> = NavigationProp<
	ParamList,
	RouteName,
	NavigatorID,
	StackNavigationState<ParamList>,
	ComponentStackNavigationOptions,
	ComponentStackNavigationEventMap
> &
	StackActionHelpers<ParamList>;

/**
 * @deprecated Component stack is deprecated. Use blank stack instead.
 */
export type ComponentStackScreenProps<
	ParamList extends ParamListBase,
	RouteName extends keyof ParamList = string,
	NavigatorID extends string | undefined = undefined,
> = {
	navigation: ComponentStackNavigationProp<ParamList, RouteName, NavigatorID>;
	route: RouteProp<ParamList, RouteName>;
};

/**
 * @deprecated Component stack is deprecated. Use blank stack instead.
 */
export type ComponentStackOptionsArgs<
	ParamList extends ParamListBase,
	RouteName extends keyof ParamList = keyof ParamList,
	NavigatorID extends string | undefined = undefined,
> = ComponentStackScreenProps<ParamList, RouteName, NavigatorID> & {
	theme: Theme;
};

/**
 * @deprecated Component stack is deprecated. Use blank stack instead.
 */
export type ComponentStackNavigationHelpers = NavigationHelpers<
	ParamListBase,
	ComponentStackNavigationEventMap
>;

type ComponentStackNavigationConfig = {};

/**
 * Props passed to overlay components in component-stack.
 * Uses the shared OverlayProps type with component-stack's navigation type.
 *
 * @deprecated Component stack is deprecated. Use blank stack instead.
 */
export type ComponentStackOverlayProps<
	ParamList extends ParamListBase = ParamListBase,
	RouteName extends keyof ParamList = keyof ParamList,
	NavigatorID extends string | undefined = undefined,
> = OverlayProps<
	ComponentStackNavigationProp<ParamList, RouteName, NavigatorID>,
	ParamList,
	RouteName
>;

type ComponentStackScreenTransitionConfig = ScreenTransitionConfig & {
	/**
	 * Whether to detach the previous screen from the view hierarchy to save memory.
	 * Set it to `false` if you need the previous screen to be seen through the active screen.
	 * Only applicable if `detachInactiveScreens` isn't set to `false`.
	 */
	detachPreviousScreen?: boolean;
};

/**
 * @deprecated Component stack is deprecated. Use blank stack instead.
 */
export type ComponentStackNavigationOptions =
	ComponentStackScreenTransitionConfig & {};

/**
 * @deprecated Component stack is deprecated. Use blank stack instead.
 */
export type ComponentStackNavigatorProps = DefaultNavigatorOptions<
	ParamListBase,
	string | undefined,
	StackNavigationState<ParamListBase>,
	ComponentStackNavigationOptions,
	ComponentStackNavigationEventMap,
	ComponentStackNavigationProp<ParamListBase>
> &
	StackRouterOptions &
	ComponentStackNavigationConfig;

/**
 * @deprecated Component stack is deprecated. Use blank stack instead.
 */
export type ComponentStackDescriptor = Descriptor<
	ComponentStackNavigationOptions,
	ComponentStackNavigationProp<ParamListBase>,
	RouteProp<ParamListBase>
>;
