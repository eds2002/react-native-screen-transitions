import type { ReduceMotion } from "react-native-reanimated";

/**
 * Internal spring animation configuration.
 *
 * @param mass - The weight of the spring. Reducing this value makes the
 *   animation faster.
 * @param damping - How quickly a spring slows down. Higher damping means the
 *   spring will come to rest faster.
 * @param stiffness - How bouncy the spring is.
 * @param duration - Perceptual duration of the animation in milliseconds.
 *   Actual duration is 1.5 times the value of perceptual duration.
 * @param dampingRatio - How damped the spring is. Value `1` means the spring is
 *   critically damped, value `<1` means the spring is underdamped and value
 *   `>1` means the spring is overdamped.
 * @param velocity - Initial velocity applied to the spring equation.
 * @param overshootClamping - Whether a spring can bounce over the `toValue`.
 * @param energyThreshold - Relative energy threshold below which the spring
 *   will snap to `toValue` without further oscillations.
 * @param reduceMotion - Optional reduced-motion override. `ReduceMotion.Always`
 *   finishes immediately, `ReduceMotion.Never` runs normally, and
 *   `ReduceMotion.System` is treated like the default in this internal fork.
 * @see https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/#config-
 */
export type SpringConfig = {
	mass?: number;
	overshootClamping?: boolean;
	energyThreshold?: number;
	velocity?: number;
	reduceMotion?: ReduceMotion;
} & (
	| {
			stiffness?: number;
			damping?: number;
			duration?: never;
			dampingRatio?: never;
			clamp?: never;
	  }
	| {
			stiffness?: never;
			damping?: never;
			duration?: number;
			dampingRatio?: number;
			clamp?: { min?: number; max?: number };
	  }
);
