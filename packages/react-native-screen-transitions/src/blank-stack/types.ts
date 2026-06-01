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
import type { InactiveBehavior, ScreenTransitionConfig } from "../shared";
import type { OverlayProps } from "../shared/types/overlay.types";
import type { StackSceneActivity } from "../shared/types/stack.types";

export type { InactiveBehavior } from "../shared";

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
	 * Controls how inactive blank-stack screens are retained after they are no
	 * longer active.
	 *
	 * For a stack shaped as A(inactive), B(inert), C(active):
	 *
	 * - `keep`: keeps A mounted, attached, visible, and non-interactive.
	 * - `freeze`: keeps A's last painted UI visible and asks the platform to
	 *   stop or suspend inactive work where possible.
	 * - `detach`: removes A from native/view presentation after the screen that
	 *   exposes it has safely painted.
	 * - `unmount`: removes A's React subtree after safe paint when the route has
	 *   no nested navigation state.
	 *
	 * On web, or when native screens are disabled, `keep`, `freeze`, and
	 * `detach` currently have no meaningful retention effect. This will change
	 * once the implementation can use React 19.2's Activity component.
	 *
	 * @default "detach" on native, "unmount" on web
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
	StackRouterOptions &
	BlankStackFactoryOptions;

export type BlankStackDescriptor = Descriptor<
	BlankStackNavigationOptions,
	BlankStackNavigationProp<ParamListBase>,
	RouteProp<ParamListBase>
> & {
	activity: StackSceneActivity;
};
