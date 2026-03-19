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

/**
 * Factory-only options for `createBlankStackNavigator`.
 *
 * Use these when you need to change how the blank stack itself is hosted,
 * not how individual screens transition.
 */
export interface BlankStackFactoryOptions {
	/**
	 * Creates an isolated navigation tree for embedded flows.
	 *
	 * Use this when the blank stack needs to live inside another screen or host
	 * application without joining the parent React Navigation tree.
	 *
	 * When enabled, the navigator:
	 * - wraps itself in `NavigationIndependentTree` + `NavigationContainer`
	 * - skips the shared native `ScreenContainer`
	 *
	 * Leave this disabled for normal top-level app stacks.
	 */
	independent?: boolean;
	/**
	 * Enables native screen primitives on supported native platforms.
	 *
	 * Use this when you want the embedded blank stack to keep `react-native-screens`
	 * behavior such as native activity state and freezing.
	 *
	 * Set this to `false` when you want the blank stack to render with regular
	 * views instead of native screen primitives. This is useful for embedded
	 * flows where plain views are a better fit than native screen layering.
	 */
	enableNativeScreens?: boolean;
}

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
	StackRouterOptions;

export type BlankStackDescriptor = Descriptor<
	BlankStackNavigationOptions,
	BlankStackNavigationProp<ParamListBase>,
	RouteProp<ParamListBase>
>;
