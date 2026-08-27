import type {
	DefaultNavigatorOptions,
	Descriptor,
	NavigationProp,
	ParamListBase,
	RouteProp,
	StackActionHelpers,
	StackNavigationState,
	StackRouterOptions,
	Theme,
} from "@react-navigation/native";
import type { OverlayProps } from "./overlay.types";
import type { InactiveBehavior, ScreenTransitionConfig } from "./screen.types";

export type { InactiveBehavior } from "./screen.types";

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

/**
 * Props passed to overlay components in blank-stack.
 * Uses the shared OverlayProps type with blank-stack's navigation type.
 */
export type BlankStackOverlayProps<
	ParamList extends ParamListBase = ParamListBase,
	RouteName extends keyof ParamList = keyof ParamList,
	NavigatorID extends string | undefined = undefined,
> = OverlayProps<
	BlankStackNavigationProp<ParamList, RouteName, NavigatorID>,
	ParamList,
	RouteName
>;

export type BlankStackNavigationOptions = ScreenTransitionConfig & {
	/**
	 * Controls how inactive blank-stack screens are retained after they are no
	 * longer active.
	 *
	 * For a stack shaped as A(inactive), B(inert), C(active):
	 *
	 * - `hide`: keeps A mounted, pauses/freezes inactive work where supported,
	 *   and hides native/view presentation after the screen that exposes it has
	 *   safely painted.
	 * - `pause`: keeps A's last painted UI visible and asks the platform to stop
	 *   or suspend inactive work where possible.
	 * - `unmount`: removes A's React subtree after safe paint when the route has
	 *   no nested navigation state.
	 * - `keep`: keeps A mounted, attached, visible, non-interactive, and running.
	 *
	 * On web, or when native screens are disabled, `hide` and `pause` cannot
	 * currently suspend React work. This will change once the implementation can
	 * use React 19.2's Activity component.
	 *
	 * @default "hide" on native, "unmount" on web
	 */
	inactiveBehavior?: InactiveBehavior;
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
