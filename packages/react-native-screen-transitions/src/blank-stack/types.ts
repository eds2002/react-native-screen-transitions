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
import type { EdgeInsets } from "react-native-safe-area-context";
import type { ScreenProps } from "react-native-screens";
import type {
	OverlayInterpolationProps,
	ScreenStyleInterpolator,
	TransitionSpec,
} from "../shared/types/animation";
import type {
	GestureActivationArea,
	GestureDirection,
} from "../shared/types/gesture";

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
	 * Options for the back button.
	 */
	back?: {
		/**
		 * Title of the previous screen.
		 */
		title: string;
	};
	/**
	 * Route object for the current screen.
	 */
	route: Route<string>;
	/**
	 * Navigation prop for the overlay.
	 */
	navigation: BlankStackNavigationProp<ParamListBase>;
	/**
	 * Safe area insets for the screen.
	 */
	insets: EdgeInsets;
	/**
	 * Accumulated progress across the stack for the overlay owner and subsequent screens.
	 */
	animation: DerivedValue<OverlayInterpolationProps>;
	/**
	 * Index of the active route
	 */
	focusedIndex: number;
};

export type BlankStackScreenTransitionConfig = {
	/**
	 * The user-provided function to calculate styles based on animation progress.
	 */
	screenStyleInterpolator?: ScreenStyleInterpolator;
	/**
	 * The Reanimated animation config for opening and closing transitions.
	 */
	transitionSpec?: TransitionSpec;
	/**
	 * Whether the gesture is enabled.
	 */
	gestureEnabled?: boolean;
	/**
	 * The direction of the swipe gesture used to dismiss the screen.
	 */
	gestureDirection?: GestureDirection | GestureDirection[];
	/**
	 * How much the gesture's final velocity impacts the dismiss decision.
	 */
	gestureVelocityImpact?: number;
	/**
	 * Whether to detach the previous screen from the view hierarchy to save memory.
	 * Set it to `false` if you need the previous screen to be seen through the active screen.
	 * Only applicable if `detachInactiveScreens` isn't set to `false`.
	 * Defaults to `false` for the last screen for modals, otherwise `true`.
	 */
	detachPreviousScreen?: boolean;
	/**
	 * Distance threshold for gesture recognition throughout the screen.
	 */
	gestureResponseDistance?: number;
	/**
	 * Whether the gesture drives the progress.
	 */
	gestureDrivesProgress?: boolean;
	/**
	 * The area of the screen where the gesture is activated.
	 */
	gestureActivationArea?: GestureActivationArea;
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
	 * Whether the home indicator should prefer to stay hidden on this screen. Defaults to `false`.
	 *
	 * @platform ios
	 */
	autoHideHomeIndicator?: boolean;
	/**
	 * Whether the keyboard should hide when swiping to the previous screen. Defaults to `false`.
	 *
	 * @platform ios
	 */
	keyboardHandlingEnabled?: boolean;
	/**
	 * Sets the visibility of the navigation bar. Defaults to `false`.
	 *
	 * @platform android
	 */
	navigationBarHidden?: boolean;
	/**
	 * Sets the status bar animation (similar to the `StatusBar` component).
	 * On Android, setting either `fade` or `slide` will set the transition of status bar color. On iOS, this option applies to appereance animation of the status bar.
	 * Requires setting `View controller-based status bar appearance -> YES` (or removing the config) in your `Info.plist` file.
	 *
	 * Defaults to `fade` on iOS and `none` on Android.
	 *
	 * Only supported on Android and iOS.
	 *
	 * @platform android, ios
	 */
	statusBarAnimation?: ScreenProps["statusBarAnimation"];
	/**
	 * Whether the status bar should be hidden on this screen.
	 * Requires setting `View controller-based status bar appearance -> YES` in your Info.plist file.
	 *
	 * Only supported on Android and iOS.
	 *
	 * @platform android, ios
	 */
	statusBarHidden?: boolean;
	/**
	 * Sets the status bar color (similar to the `StatusBar` component).
	 * Requires setting `View controller-based status bar appearance -> YES` (or removing the config) in your `Info.plist` file.
	 * `auto` and `inverted` are supported only on iOS. On Android, they will fallback to `light`.
	 *
	 * Defaults to `auto` on iOS and `light` on Android.
	 *
	 * Only supported on Android and iOS.
	 *
	 * @platform android, ios
	 */
	statusBarStyle?: ScreenProps["statusBarStyle"];
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
