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
import type { DerivedValue } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "../shared";
import type {
	OverlayInterpolationProps,
	ScreenInterpolationProps,
} from "../shared/types/animation.types";

export type BlankStackNavigationEventMap = {
	/**
	 * Event which fires when a transition animation starts.
	 */
	transitionStart: { data: { closing: boolean } };
	/**
	 * Event which fires when a transition animation ends.
	 */
	transitionEnd: { data: { closing: boolean } };
	/**
	 * Event which fires when a swipe back is canceled on iOS.
	 */
	gestureCancel: { data: undefined };
	/**
	 * Event which fires when screen is in sheet presentation & it's detent changes.
	 *
	 * In payload it caries two fields:
	 *
	 * * `index` - current detent index in the `sheetAllowedDetents` array,
	 * * `stable` - on Android `false` value means that the user is dragging the sheet or it is settling; on iOS it is always `true`.
	 */
	sheetDetentChange: { data: { index: number; stable: boolean } };
};

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
export type BlankStackNavigationConfig = {};

export type BlankStackOverlayProps = {
	/**
	 * Route of the currently focused screen in the stack.
	 */
	focusedRoute: Route<string>;

	/**
	 * Index of the focused route in the stack.
	 */
	focusedIndex: number;

	/**
	 * All routes currently in the stack.
	 */
	routes: Route<string>[];

	/**
	 * Options passed to the overlay component.
	 */
	overlayOptions?: {
		title?: string;
		subtitle?: string;
		[key: string]: unknown;
	};

	/**
	 * Navigation prop for the overlay.
	 */
	navigation: BlankStackNavigationProp<ParamListBase>;

	/**
	 * Animation values for the overlay.
	 */
	overlayAnimation: DerivedValue<OverlayInterpolationProps>;

	/**
	 * Animation values for the screen.
	 */
	screenAnimation: DerivedValue<ScreenInterpolationProps>;
};

export type BlankStackScreenTransitionConfig = ScreenTransitionConfig & {
	/**
	 * Whether to detach the previous screen from the view hierarchy to save memory.
	 * Set it to `false` if you need the previous screen to be seen through the active screen.
	 * Only applicable if `detachInactiveScreens` isn't set to `false`.
	 * Defaults to `false` for the last screen for modals, otherwise `true`.
	 */
	detachPreviousScreen?: boolean;
};

export type BlankStackNavigationOptions = BlankStackScreenTransitionConfig & {
	/**
	 * Function that given `OverlayProps` returns a React Element to display as a overlay.
	 */
	overlay?: (props: BlankStackOverlayProps) => React.ReactNode;

	/**
	 * Layout: How the Overlay is positioned
	 * - 'float': Single persistent overlay above all screens (like iOS)
	 * - 'screen': Per-screen overlay that transitions with content
	 * @default 'screen'
	 */
	overlayMode?: "float" | "screen";

	/**
	 * Whether to show the overlay. The overlay is shown by default.
	 * Setting this to `false` hides the overlay.
	 */
	overlayShown?: boolean;

	/**
	 * Options passed to the overlay component.
	 */
	overlayOptions?: {
		title?: string;
		subtitle?: string;
		[key: string]: unknown;
	};

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
