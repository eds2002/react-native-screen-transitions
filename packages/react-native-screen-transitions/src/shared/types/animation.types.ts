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
	/**
	 * Animation progress for this screen.
	 * - `0`: Screen is fully off-screen (entering)
	 * - `1`: Screen is fully visible (active)
	 *
	 * This value animates from 0 to 1 when the screen enters,
	 * and from 1 to 0 when it exits.
	 */
	progress: number;

	/**
	 * Whether this screen is in the process of being dismissed.
	 * - `0`: Screen is opening or active
	 * - `1`: Screen is closing/being dismissed
	 *
	 * Use this to trigger different animations when navigating back vs forward.
	 */
	closing: number;

	/**
	 * Whether this screen is currently animating.
	 * - `0`: No animation in progress
	 * - `1`: Animation or gesture is in progress
	 */
	animating: number;

	/**
	 * Live gesture values for this screen.
	 * Contains translation (x, y), normalized values (-1 to 1),
	 * and flags for dragging/dismissing state.
	 */
	gesture: GestureValues;

	/**
	 * Custom metadata passed from screen options.
	 * Use this for conditional animation logic instead of checking route names.
	 *
	 * @example
	 * // In screen options:
	 * options={{ meta: { scalesOthers: true } }}
	 *
	 * // In animation logic:
	 * if (props.next?.meta?.scalesOthers) { ... }
	 */
	meta?: Record<string, unknown>;

	/**
	 * The route object for this screen.
	 *
	 * @deprecated Use `meta` instead for conditional animation logic.
	 * Pass route params via options: `options={({ route }) => ({ meta: { id: route.params.id } })}`
	 * This field may be removed in a future version.
	 */
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
	 * The screen state that is NOT driving the transition.
	 * When focused, this is the previous screen. When not focused, this is the current screen.
	 */
	inactive: ScreenTransitionState | undefined;

	/**
	 * Whether the active screen is currently transitioning (either being dragged or animating).
	 * @deprecated Use `active.animating` instead.
	 */
	isActiveTransitioning: boolean;

	/**
	 * Whether the active screen is in the process of being dismissed/closed.
	 * @deprecated Use `active.closing` instead.
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
