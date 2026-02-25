import type { TextStyle, ViewStyle } from "react-native";
import type {
	StyleProps,
	WithSpringConfig,
	WithTimingConfig,
} from "react-native-reanimated";
import type { EdgeInsets } from "react-native-safe-area-context";
import type { BoundsAccessor } from "./bounds.types";
import type { GestureValues } from "./gesture.types";
import type { Layout } from "./screen.types";
import type { BaseStackRoute } from "./stack.types";

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
	 * Whether this screen is in the process of entering.
	 * - `0`: Screen is closing or inactive
	 * - `1`: Screen is opening/entering
	 *
	 * Use this to trigger different animations when navigating back vs forward.
	 */
	entering: number;

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
	 */
	route: BaseStackRoute;
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
	 * Animated index of the current snap point.
	 * Interpolates between indices during gestures/animations.
	 * - Returns -1 if no snap points are defined
	 * - Returns 0 when at or below first snap point
	 * - Returns fractional values between snap points (e.g., 1.5 = halfway between snap 1 and 2)
	 * - Returns length-1 when at or above last snap point
	 */
	snapIndex: number;

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

/**
 * Animated style properties with full autocomplete.
 *
 * Uses React Native's `ViewStyle & TextStyle` instead of Reanimated's `StyleProps`
 * (which has `[key: string]: any`) so TypeScript can provide autocomplete and catch typos.
 */
export type AnimatedViewStyle = ViewStyle & TextStyle;

/**
 * Explicit slot format with separate `style` and `props` buckets.
 *
 * - `style` is applied via `useAnimatedStyle` (transform, opacity, backgroundColor, etc.)
 * - `props` is applied via `useAnimatedProps` (component-specific props like BlurView intensity)
 */
export type TransitionSlotExplicit = {
	/** Animated styles applied via useAnimatedStyle. */
	style?: AnimatedViewStyle;
	/** Animated props applied via useAnimatedProps (e.g., BlurView intensity, SquircleView cornerRadius). */
	props?: Record<string, any>;
};

/**
 * A slot in the interpolated style map.
 *
 * Can be written in two forms:
 * - **Shorthand**: Write styles directly — `{ opacity: 0.5, transform: [...] }`
 * - **Explicit**: Use `style` and/or `props` buckets — `{ style: { opacity: 0.5 }, props: { intensity: 80 } }`
 */
export type TransitionSlotStyle = AnimatedViewStyle | TransitionSlotExplicit;

/**
 * Internal normalized slot format used after the backward-compat shim.
 * Always uses the explicit `{ style, props }` shape (with Reanimated's full StyleProps).
 */
export type NormalizedTransitionSlotStyle = {
	style?: StyleProps;
	props?: Record<string, any>;
};

/**
 * Normalized interpolated style map used internally after the backward-compat shim.
 * All slots use the explicit `{ style, props }` shape.
 */
export type NormalizedTransitionInterpolatedStyle = {
	/** Animated style and props for the main screen content view. */
	content?: NormalizedTransitionSlotStyle;
	/** Animated style and props for the backdrop layer between screens. */
	backdrop?: NormalizedTransitionSlotStyle;
	/** Animated style and props for the background component layer within the screen. */
	background?: NormalizedTransitionSlotStyle;
	/** Custom styles/props by id for Transition.View components. */
	[id: string]: NormalizedTransitionSlotStyle | undefined;
};

/**
 * Public new-format interpolator result with type-safe style autocomplete.
 * Uses `TransitionSlotStyle` (backed by `AnimatedViewStyle`) for full style autocomplete.
 */
export type NewTransitionInterpolatedStyle = {
	/** Animated style and props for the main screen content view. */
	content?: TransitionSlotStyle;
	/** Animated style and props for the backdrop layer between screens. */
	backdrop?: TransitionSlotStyle;
	/** Animated style and props for the background component layer within the screen. */
	background?: TransitionSlotStyle;
	/** Custom styles/props by id for Transition.View components. */
	[id: string]: TransitionSlotStyle | undefined;
};

/**
 * @deprecated Use the nested format instead: `{ content: { style }, backdrop: { style } }`.
 * This flat format is auto-converted via a backward-compat shim.
 */
export type LegacyTransitionInterpolatedStyle = {
	contentStyle?: AnimatedViewStyle;
	backdropStyle?: AnimatedViewStyle;
	overlayStyle?: AnimatedViewStyle;
	[id: string]: AnimatedViewStyle | undefined;
};

/**
 * The return type of `screenStyleInterpolator`.
 * Accepts both the new nested format and the legacy flat format (auto-converted).
 */
export type TransitionInterpolatedStyle =
	| NewTransitionInterpolatedStyle
	| LegacyTransitionInterpolatedStyle;

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
