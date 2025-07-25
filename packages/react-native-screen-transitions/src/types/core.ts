import type { ScreenStyleInterpolator, TransitionSpec } from "./animation";
import type { GestureDirection } from "./gesture";

export type ScreenStatus = 0 | 1;

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
