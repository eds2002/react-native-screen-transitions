import type { ScaledSize } from "react-native";
import type {
	SharedValue,
	StyleProps,
	WithSpringConfig,
	WithTimingConfig,
} from "react-native-reanimated";
import type { EdgeInsets } from "react-native-safe-area-context";
import type { BoundKey, BoundsMap } from "./bounds";

export type ScreenProgress = {
	progress: SharedValue<number>;
	gesture: GestureValues;
	activeBoundId?: BoundKey;
	allBounds?: BoundsMap;
};

export interface BaseScreenInterpolationProps {
	/** Values for the screen that is the focus of the transition (e.g., the one opening). */
	previous: ScreenProgress | undefined;
	current: ScreenProgress;
	/** Values for the screen immediately behind the current one in the screen. */
	next: ScreenProgress | undefined;
	/** Layout measurements for the screen. */
	layouts: {
		/** The `width` and `height` of the screen container. */
		screen: ScaledSize;
	};
	/** The safe area insets for the screen. */
	insets: EdgeInsets;
	/** A flag indicating if the current screen is in the process of closing. */
	closing: boolean;
	/**
	 * A flag indicating if the screen is in the process of animating.
	 */
	animating: SharedValue<number>;
}

export interface _BaseScreenInterpolationProps
	extends BaseScreenInterpolationProps {
	screenStyleInterpolator: ScreenStyleInterpolator;
}

/**
 * Utility functions for the screen.
 */
export interface ScreenInterpolationProps extends BaseScreenInterpolationProps {
	/**
	 * A flag indicating if the screen is focused.
	 */
	isFocused: boolean;
	/**
	 * Combined progress of current and next (0 - 2).
	 */
	progress: number;
	/**
	 * Interpolate a value between two ranges. This uses the progress value (0-2) to interpolate between the input and output ranges.
	 */
	interpolate: (inputRange: number[], outputRange: number[]) => number;
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
