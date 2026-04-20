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
 * Additional props accepted by the blank stack navigator.
 *
 * These can be passed to `<BlankStack.Navigator />` in the dynamic API, and
 * they are also supported as top-level keys in static navigator config.
 *
 * The exported name is kept for backward compatibility.
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
}

/**
 * Props passed to overlay components in blank-stack.
 * Uses the shared OverlayProps type with blank-stack's navigation type.
 */
export type BlankStackOverlayProps = OverlayProps<
	BlankStackNavigationProp<ParamListBase>
>;

export type BlankStackNavigationOptions = ScreenTransitionConfig & {
	/**
	 * What should happen when screens become inactive.
	 *
	 * A screen becomes inactive once it falls deeper than the inert screen in the
	 * stack, unless another rule keeps it alive (for example a preloaded route or
	 * a non-blocking backdrop above it).
	 *
	 * - `pause`: Keep the screen mounted, but pause its effects while inactive
	 * - `unmount`: Remove inactive screens unless they hold nested navigator state
	 * - `none`: Keep inactive screens mounted and let their effects continue running
	 *
	 * Defaults to `pause`.
	 */
	inactiveBehavior?: "pause" | "unmount" | "none";
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
	BlankStackFactoryOptions;

export type BlankStackDescriptor = Descriptor<
	BlankStackNavigationOptions,
	BlankStackNavigationProp<ParamListBase>,
	RouteProp<ParamListBase>
>;
