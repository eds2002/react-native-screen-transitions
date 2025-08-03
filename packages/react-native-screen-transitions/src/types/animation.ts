import type {
	MeasuredDimensions,
	StyleProps,
	WithSpringConfig,
	WithTimingConfig,
} from "react-native-reanimated";
import type { EdgeInsets } from "react-native-safe-area-context";
import type { BoundsBuilder } from "./bounds";
import type { GestureValues } from "./gesture";

export type ScreenTransitionState = {
	progress: number;
	closing: number;
	animating: number;
	gesture: GestureValues;
	bounds: Record<string, MeasuredDimensions>;
};

export interface ScreenInterpolationProps {
	/** Values for the screen that is the focus of the transition (e.g., the one opening). */
	previous: ScreenTransitionState | undefined;
	current: ScreenTransitionState;
	/** Values for the screen immediately behind the current one in the screen. */
	next: ScreenTransitionState | undefined;
	/** Layout measurements for the screen. */
	layouts: {
		/** The `width` and `height` of the screen container. */
		screen: {
			width: number;
			height: number;
		};
	};
	/** The safe area insets for the screen. */
	insets: EdgeInsets;
	/** The id of the active bound. */
	activeBoundId: string | null;
	/** Whether the screen is focused. */
	focused: boolean;
	/** The progress of the screen transitions (0-2). */
	progress: number;
	/** A function that returns a bounds builder for the screen. */
	bounds: (id?: string) => BoundsBuilder;
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
