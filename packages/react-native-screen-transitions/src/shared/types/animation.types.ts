import type { TextStyle, ViewStyle } from "react-native";
import type {
	StyleProps,
	WithSpringConfig,
	WithTimingConfig,
} from "react-native-reanimated";
import type { EdgeInsets } from "react-native-safe-area-context";
import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../constants";
import type { BoundsAccessor } from "./bounds.types";
import type { GestureValues } from "./gesture.types";
import type { ScreenLayouts, ScreenTransitionConfig } from "./screen.types";
import type { BaseStackRoute } from "./stack.types";

/**
 * Public screen option values exposed to `screenStyleInterpolator`.
 *
 * These are the values we consider useful to change dynamically with
 * `navigation.setOptions()`. If you need another existing screen option here,
 * open a request with the use case and why the interpolator needs it.
 */
export type ScreenTransitionOptions = Pick<
	ScreenTransitionConfig,
	| "gestureEnabled"
	| "experimental_allowDisabledGestureTracking"
	| "gestureDirection"
	| "gestureSensitivity"
	| "gestureVelocityImpact"
	| "gestureSnapVelocityImpact"
	| "gestureReleaseVelocityScale"
	| "gestureResponseDistance"
	| "gestureProgressMode"
	| "gestureDrivesProgress"
	| "gestureActivationArea"
	| "gestureSnapLocked"
	| "sheetScrollGestureBehavior"
	| "backdropBehavior"
>;

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
	 * Whether this screen is actively in its opening phase.
	 * - `0`: Screen is settled, inactive, or closing
	 * - `1`: Screen is currently opening/entering
	 *
	 * This flips back to `0` once the open animation finishes.
	 */
	entering: number;

	/**
	 * Whether this screen is about to begin a transition attempt.
	 * - `0`: No pre-animation handoff is pending
	 * - `1`: This is the last clean frame before transition-driven motion begins
	 *
	 * This phase is intentionally short-lived and emits once per transition attempt.
	 * For gesture-driven transitions, it rises on gesture start, not on release.
	 * The release/settle animation is considered part of the same attempt and must
	 * not re-trigger `willAnimate`.
	 */

	willAnimate: number;

	/**
	 * Whether this screen is currently animating.
	 * - `0`: No animation in progress
	 * - `1`: Animation or gesture is in progress
	 */
	animating: number;

	/**
	 * Whether this screen is fully settled (not transitioning and not dismissing).
	 * - `0`: Transition/gesture is active or dismissing
	 * - `1`: Screen is fully settled/idle
	 */
	settled: number;

	/**
	 * Whether this screen is logically complete for choreography purposes.
	 * - `0`: The screen is still meaningfully away from its animation target
	 * - `1`: The screen is visually close enough to its target to be treated as done
	 *
	 * Unlike `settled`, this may become `1` before the underlying spring fully stops.
	 */
	logicallySettled: number;

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
	 * Public screen option values exposed to `screenStyleInterpolator`.
	 *
	 * These are the values we consider useful to change dynamically with
	 * `navigation.setOptions()`. If you need another existing screen option here,
	 * open a request with the use case and why the interpolator needs it.
	 */
	options: ScreenTransitionOptions;

	/**
	 * The route object for this screen.
	 */
	route: BaseStackRoute;

	/**
	 * Layout measurements for this specific screen.
	 */
	layouts: ScreenLayouts;

	/**
	 * Live animated index of this screen's current snap point.
	 * Interpolates between indices during gestures/animations.
	 * - Returns -1 if no snap points are defined
	 * - Returns 0 when at or below first snap point
	 * - Returns fractional values between snap points (e.g., 1.5 = halfway between snap 1 and 2)
	 * - Returns length-1 when at or above last snap point
	 */
	animatedSnapIndex: number;

	/**
	 * Target snap point index for this screen.
	 *
	 * Unlike `animatedSnapIndex`, this follows the current target progress rather
	 * than live gesture progress. It updates when the transition target changes,
	 * such as initial mount, `snapTo()`, or gesture release.
	 */
	snapIndex: number;
};

export type ScreenTransitionDepthTarget = {
	/**
	 * Relative transition depth.
	 *
	 * `0` resolves the current transition, negative values resolve ancestors, and
	 * positive values resolve descendants.
	 */
	depth: number;
};

export type ScreenTransitionTarget = ScreenTransitionDepthTarget;

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
	layouts: ScreenLayouts;

	/**
	 * The safe area insets for the screen.
	 */
	insets: EdgeInsets;

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
	 * Whether the active transition is visually close enough to its target to be
	 * treated as complete, even if the animation is still physically settling.
	 */
	logicallySettled: number;

	/**
	 * Function that provides access to bounds helpers for shared screen transitions.
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
}

/**
 * Returning `null`, `undefined`, or `{}` applies no transition styles for the
 * current frame.
 */
export type ScreenStyleInterpolator = (
	props: ScreenInterpolationProps,
) => TransitionInterpolatedStyle | null | undefined;

/**
 * Animated style properties with full autocomplete.
 *
 * Uses React Native's `ViewStyle & TextStyle` instead of Reanimated's `StyleProps`
 * (which has `[key: string]: any`) so TypeScript can provide autocomplete and catch typos.
 */
export type AnimatedViewStyle = ViewStyle & TextStyle;

type TransitionSlotDefinition = {
	/** Animated styles applied via `useAnimatedStyle`. */
	style?: AnimatedViewStyle;
	/** Animated props applied via `useAnimatedProps`. */
	props?: Record<string, unknown>;
};

/**
 * A slot in the interpolated style map.
 *
 * Can be written in two forms:
 * - **Shorthand**: Write styles directly — `{ opacity: 0.5, transform: [...] }`
 * - **Explicit**: Use `style` and/or `props` buckets — `{ style: { opacity: 0.5 }, props: { intensity: 80 } }`
 */
export type TransitionSlotStyle = AnimatedViewStyle | TransitionSlotDefinition;

/**
 * Runtime options returned by `screenStyleInterpolator`.
 *
 * These values are not style slots. They are derived per frame and consumed by
 * the transition runtime.
 *
 * If `gestureSensitivity` is derived from the current gesture, prefer
 * `active.gesture.raw` so the sensitivity calculation does not feed back into
 * itself.
 */
export type TransitionInterpolatorOptions = ScreenTransitionOptions;

/**
 * Internal normalized slot format.
 * Always uses the explicit `{ style, props }` shape (with Reanimated's full StyleProps).
 */
export type NormalizedTransitionSlotStyle = {
	style?: StyleProps;
	props?: Record<string, unknown>;
};

/**
 * Normalized interpolated style map used internally.
 * All slots use the explicit `{ style, props }` shape.
 */
export type NormalizedTransitionInterpolatedStyle = {
	/** Animated style and props for the main screen content view. */
	content?: NormalizedTransitionSlotStyle;
	/** Animated style and props for the backdrop layer between screens. */
	backdrop?: NormalizedTransitionSlotStyle;
	/** Animated style and props for the surface component layer within the screen. */
	surface?: NormalizedTransitionSlotStyle;
	/** Animated style and props for the navigation mask container layer. */
	[NAVIGATION_MASK_CONTAINER_STYLE_ID]?: NormalizedTransitionSlotStyle;
	/** Animated style and props for the navigation mask element layer. */
	[NAVIGATION_MASK_ELEMENT_STYLE_ID]?: NormalizedTransitionSlotStyle;
	/** Custom styles/props by id for Transition.View components. */
	[id: string]: NormalizedTransitionSlotStyle | undefined;
};

/**
 * The return type of `screenStyleInterpolator`.
 */
export type TransitionInterpolatedStyle = {
	/**
	 * Runtime options for the current frame.
	 *
	 * This reserved key is stripped before style slot normalization.
	 */
	options?: TransitionInterpolatorOptions;
	/** Animated style and props for the main screen content view. */
	content?: TransitionSlotStyle;
	/** Animated style and props for the backdrop layer between screens. */
	backdrop?: TransitionSlotStyle;
	/** Animated style and props for the surface component layer within the screen. */
	surface?: TransitionSlotStyle;
	/** Animated style and props for the navigation mask container layer. */
	[NAVIGATION_MASK_CONTAINER_STYLE_ID]?: TransitionSlotStyle;
	/** Animated style and props for the navigation mask element layer. */
	[NAVIGATION_MASK_ELEMENT_STYLE_ID]?: TransitionSlotStyle;
	/** Custom styles/props by id for Transition.View components. */
	[id: string]: TransitionSlotStyle | TransitionInterpolatorOptions | undefined;
};

/**
 * A Reanimated animation configuration object.
 */
export type AnimationConfig = WithSpringConfig | WithTimingConfig;

/**
 * Defines separate animation configurations for screen transitions and snap point changes.
 */
export interface TransitionSpec {
	/**
	 * Animation config for opening/entering a screen.
	 */
	open?: AnimationConfig;
	/**
	 * Animation config for closing/exiting a screen.
	 */
	close?: AnimationConfig;
	/**
	 * Animation config for expanding to a higher snap point.
	 * Uses lower intensity than `open` to match smaller movement distances.
	 */
	expand?: AnimationConfig;
	/**
	 * Animation config for collapsing to a lower snap point.
	 * Uses lower intensity than `close` to match smaller movement distances.
	 */
	collapse?: AnimationConfig;
}
