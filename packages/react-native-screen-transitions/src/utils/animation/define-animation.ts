import type { Animation, ReduceMotion } from "react-native-reanimated";

type Timestamp = number;

const REACT_NATIVE_RUNTIME_KIND = 1;
const REDUCE_MOTION_SYSTEM = "system";
const REDUCE_MOTION_ALWAYS = "always";

/** How many of an animation's first frames advance at most MAX_STARTUP_STEP_MS each. */
const STARTUP_FRAMES = 3;
/** One display frame at 60 Hz. */
const MAX_STARTUP_STEP_MS = 1000 / 60;

const getRuntimeKind = () => {
	"worklet";
	return (globalThis as { __RUNTIME_KIND?: number }).__RUNTIME_KIND;
};

export const getReduceMotionForAnimation = (config?: ReduceMotion) => {
	"worklet";
	if (!config || config === REDUCE_MOTION_SYSTEM) {
		return undefined;
	}

	return config === REDUCE_MOTION_ALWAYS;
};

/**
 * The time an animation advances by on this frame. An animation's first frames often follow a
 * stall: the UI thread mounting the screen it moves (a heavy screen takes several frames). Time
 * lost there wasn't motion anyone saw, so for the first frames advance at most one display frame
 * each; otherwise the screen first appears part-way through its transition. Normal frames are
 * already this short and don't change.
 */
export const startupStep = (
	animation: { startupFrames: number },
	deltaTime: number,
) => {
	"worklet";
	if (animation.startupFrames >= STARTUP_FRAMES) {
		return deltaTime;
	}
	animation.startupFrames += 1;
	return Math.min(deltaTime, MAX_STARTUP_STEP_MS);
};

/**
 * Reanimated's defineAnimation for the internal animations: creates the animation on the UI
 * runtime (or returns a definition from the RN runtime) and honours reduceMotion by jumping to
 * the end, calling onReducedMotion so callers can finish their own state.
 */
export const defineInternalAnimation = <
	TAnimation extends Animation<TAnimation>,
>(
	_starting: number,
	factory: () => TAnimation,
	onReducedMotion?: () => void,
): TAnimation => {
	"worklet";
	const create = (() => {
		"worklet";
		const animation = factory();
		const baseOnStart = animation.onStart;

		animation.onStart = (
			animation: TAnimation,
			value: Parameters<TAnimation["onStart"]>[1],
			timestamp: Timestamp,
			previousAnimation: Parameters<TAnimation["onStart"]>[3],
		) => {
			"worklet";
			if (animation.reduceMotion) {
				onReducedMotion?.();
				animation.current = animation.toValue;
				animation.onFrame = () => true;
				return;
			}

			baseOnStart(animation, value, timestamp, previousAnimation);
		};

		return animation;
	}) as (() => TAnimation) & { __isAnimationDefinition?: true };

	if (getRuntimeKind() !== REACT_NATIVE_RUNTIME_KIND) {
		return create();
	}

	create.__isAnimationDefinition = true;
	return create as unknown as TAnimation;
};
