import type {
	EventArg,
	EventMapBase,
	NavigationProp,
	NavigationState,
	ParamListBase,
	RouteProp,
	ScreenListeners,
} from "@react-navigation/native";
import type { ScaledSize } from "react-native";
import type {
	SharedValue,
	StyleProps,
	WithSpringConfig,
	WithTimingConfig,
} from "react-native-reanimated";
import type { EdgeInsets } from "react-native-safe-area-context";

// biome-ignore lint/suspicious/noExplicitAny: <we ball so hard>
export type Any = any;

export type ScreenStatus = 0 | 1;

// =================================================================
// 1. CORE STATE & CONFIGURATION TYPES
// =================================================================

export interface ScreenState extends TransitionConfig {
	/**
	 * The unique key for the screen, provided by the navigator.
	 */
	id: string;
	/**
	 * The index of the screen in the history.
	 */
	index: number;
	/**
	 * The name of the screen, provided by the navigator.
	 */
	name: string;
	/**
	 * The current status of the screen's state (0: closed, 1: open).
	 */
	status: ScreenStatus;
	/**
	 * A flag indicating if the screen is currently in the process of closing.
	 */
	closing: boolean;
	/**
	 * An optional callback that fires when a programmatic animation completes.
	 */
	onAnimationFinish?: (finished?: boolean) => void;
	/**
	 * The key of the navigator that renders this route.
	 */
	navigatorKey?: string;
	/**
	 * The key of the parent navigator that renders this navigator.
	 */
	parentNavigatorKey?: string;
}

export interface ScreenStateStore {
	screens: Record<string, ScreenState>;
	screenKeys: string[];
}

export interface TransitionConfig {
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
	 * Distance threshold for gesture recognition throughout the screen.
	 */
	gestureResponseDistance?: number;
	/**
	 * Skip the default screen options.
	 */
	skipDefaultScreenOptions?: boolean;
}

// =================================================================
// 2. ANIMATION & INTERPOLATION TYPES
// =================================================================

/**
 * The comprehensive props object passed to a `ScreenStyleInterpolator` function.
 * It contains all the necessary data to calculate styles for a transition.
 */
export interface ScreenInterpolationProps {
	/** Values for the screen that is the focus of the transition (e.g., the one opening). */
	current: {
		/** The programmatic animation progress of the screen (a `SharedValue` from 0 to 1). */
		progress: SharedValue<number>;
		/** Live gesture values for the screen. */
		gesture: GestureValues;
	};
	/** Values for the screen immediately behind the current one in the screen. */
	next:
		| {
				/** The programmatic animation progress of the next screen. */
				progress: SharedValue<number>;
				/** Live gesture values for the next screen. */
				gesture: GestureValues;
		  }
		| undefined;
	/** Layout measurements for the screen. */
	layouts: {
		/** The `width` and `height` of the screen container. */
		screen: ScaledSize;
	};
	/** The safe area insets for the screen. */
	insets: EdgeInsets;
	/** A flag indicating if the current screen is in the process of closing. */
	closing: boolean;
}

export type GestureValues = {
	/**
	 * A `SharedValue` indicating if the user's finger is on the screen (0 or 1).
	 */
	isDragging: SharedValue<number>;
	/**
	 * The live horizontal translation of the gesture.
	 */
	x: SharedValue<number>;
	/**
	 * The live vertical translation of the gesture.
	 */
	y: SharedValue<number>;
	/**
	 * The live normalized horizontal translation of the gesture (-1 to 1).
	 */
	normalizedX: SharedValue<number>;
	/**
	 * The live normalized vertical translation of the gesture (-1 to 1).
	 */
	normalizedY: SharedValue<number>;
	/**
	 * A flag indicating if the screen is in the process of dismissing.
	 */
	isDismissing: SharedValue<number>;
};

export type ScreenStyleInterpolator = (
	props: ScreenInterpolationProps,
) => TransitionInterpolatedStyle;

export type TransitionInterpolatedStyle = {
	/**
	 * Animated style for the main screen view. Styles are only applied when Transition.View is present.
	 */
	contentStyle?: StyleProps;
	/**
	 * Animated style for a semi-transparent overlay. Styles are only applied when Transition.View is present.
	 */
	overlayStyle?: StyleProps;
};

/**
 * A Reanimated animation configuration object.
 */
export type AnimationConfig = WithSpringConfig | WithTimingConfig;

/**
 * Defines separate animation configurations for opening and closing a screen.
 */
export interface TransitionSpec {
	open?: AnimationConfig;
	close?: AnimationConfig;
}

// =================================================================
// 3. GESTURE TYPES
// =================================================================

export type GestureDirection =
	| "horizontal"
	| "horizontal-inverted"
	| "vertical"
	| "vertical-inverted"
	| "bidirectional";

// =================================================================
// 4. REACT NAVIGATION & EVENT TYPES (Internal Use)
// =================================================================

export interface CreateTransitionProps extends TransitionConfig {
	navigation: Any;
	route: RouteProp<ParamListBase, string>;
}

export type TransitionListeners = ScreenListeners<
	NavigationState,
	EventMapBase
>;

export type BeforeRemoveEvent = EventArg<
	"beforeRemove",
	true,
	{
		action: {
			type: string;
			payload?: object;
			source?: string;
			target?: string;
		};
	}
>;

export type FocusEvent = EventArg<"focus", false, undefined>;

export type UseNavigation = Omit<
	NavigationProp<ReactNavigation.RootParamList>,
	"getState"
> & {
	getState(): NavigationState | undefined;
};
