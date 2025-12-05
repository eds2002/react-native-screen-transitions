import type { ParamListBase, RouteProp } from "@react-navigation/native";
import type {
	StyleProps,
	WithSpringConfig,
	WithTimingConfig,
} from "react-native-reanimated";
import type { EdgeInsets } from "react-native-safe-area-context";
import type { BoundsAccessor } from "./bounds.types";
import type { Layout } from "./core.types";
import type { GestureValues } from "./gesture.types";

export interface OverlayInterpolationProps {
	progress: number;
	layouts: {
		/**
		 * The `width` and `height` of the screen container.
		 */
		screen: Layout;
	};
	insets: EdgeInsets;
}

export type ScreenTransitionState = {
	progress: number;
	closing: number;
	animating: number;
	gesture: GestureValues;
	route: RouteProp<ParamListBase>;
};

export interface ScreenInterpolationProps {
	/**
	 * Values for the screen that came before the current one in the navigation stack.
	 */
	previous: ScreenTransitionState | undefined;

	/**
	 * Values for the current screen being interpolated.
	 */
	current: ScreenTransitionState;

	/**
	 * Values for the screen that comes after the current one in the navigation stack.
	 */
	next: ScreenTransitionState | undefined;

	/**
	 * Layout measurements for the screen.
	 */
	layouts: {
		/**
		 * The `width` and `height` of the screen container.
		 */
		screen: Layout;
	};

	/**
	 * The safe area insets for the screen.
	 */
	insets: EdgeInsets;

	/**
	 * The ID of the currently active shared bound (e.g., 'a' when Transition.Pressable has sharedBoundTag='a').
	 * @deprecated
	 */
	activeBoundId?: never;

	/**
	 * Whether the current screen is the focused (topmost) screen in the stack.
	 */
	focused: boolean;

	/**
	 * Combined progress of current and next screen transitions, ranging from 0-2.
	 */
	progress: number;

	/**
	 * Accumulated progress from the current screen's position onwards in the stack.
	 * Unlike `progress` (0-2), this ranges from 0-N where N is the number of screens
	 * above the current screen. Each screen at index I sees stackProgress as the
	 * sum of all progress values from index I to the top of the stack.
	 *
	 * Example: With 4 screens pushed, screen at index 1 would see stackProgress = 3
	 * when all screens are fully transitioned.
	 *
	 * Falls back to `progress` when not in blank-stack.
	 */
	stackProgress: number;

	/**
	 * Function that provides access to bounds builders for creating shared element transitions.
	 */
	bounds: BoundsAccessor;

	/**
	 * The screen state that is currently driving the transition (either current or next, whichever is focused).
	 */
	active: ScreenTransitionState;

	/**
	 * Whether the active screen is currently transitioning (either being dragged or animating).
	 */
	isActiveTransitioning: boolean;

	/**
	 * Whether the active screen is in the process of being dismissed/closed.
	 */
	isDismissing: boolean;
}

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

	/**
	 * Define your own custom styles by using an id as the key: [id]: StyleProps
	 */
	[id: string]: StyleProps | undefined;
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
