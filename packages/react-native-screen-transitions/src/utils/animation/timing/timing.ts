import type {
	Animation,
	AnimationCallback,
	EasingFunction,
	WithTimingConfig,
} from "react-native-reanimated";
import {
	defineInternalAnimation,
	getReduceMotionForAnimation,
	startupStep,
} from "../define-animation";
import type { AnimationProgressDriver, AnimationStateCallback } from "../state";

type Timestamp = number;

const DEFAULT_DURATION = 300;

/** Reanimated's default timing easing, Easing.inOut(Easing.quad), inlined (no runtime import). */
const easeInOutQuad = (t: number) => {
	"worklet";
	return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
};

export interface TimingAnimation extends Animation<TimingAnimation> {
	type: "timing";
	easing: EasingFunction;
	startValue: number;
	/** Milliseconds of motion so far (the first frames' steps capped, see startupStep). */
	elapsed: number;
	lastTimestamp: Timestamp;
	startupFrames: number;
	toValue: number;
	current: number;
}

type withTimingType = (
	toValue: number,
	userConfig?: WithTimingConfig,
	callback?: AnimationStateCallback,
	animationProgress?: AnimationProgressDriver,
) => number;

/**
 * Internal numeric timing forked from Reanimated's `withTiming`, for the same reasons as
 * withInternalSpring: it shares the springs' startup rule (a stall before the first frames isn't
 * billed to the motion), and it drives the transition's linear progress clock
 * (`animationProgress`) from the same frames instead of a second, separate timing animation.
 *
 * Progress is the time advanced frame by frame (normal frames: the time since the last one)
 * through the config's easing, defaulting like Reanimated: 300 ms, Easing.inOut(Easing.quad).
 */
export const withInternalTiming = ((
	toValue: number,
	userConfig?: WithTimingConfig,
	callback?: AnimationStateCallback,
	animationProgress?: AnimationProgressDriver,
): Animation<TimingAnimation> => {
	"worklet";

	return defineInternalAnimation<TimingAnimation>(
		toValue,
		() => {
			"worklet";
			const duration = userConfig?.duration ?? DEFAULT_DURATION;
			const configEasing = userConfig?.easing ?? easeInOutQuad;

			const finish = (animation: TimingAnimation) => {
				"worklet";
				animation.current = animation.toValue;
				// Like Reanimated: a finished timing isn't continued by the next one towards the same value.
				animation.lastTimestamp = 0;
				animationProgress?.value.set(animationProgress.to);
			};

			function onFrame(animation: TimingAnimation, now: Timestamp): boolean {
				const deltaTime = startupStep(
					animation,
					Math.max(now - animation.lastTimestamp, 0),
				);
				animation.lastTimestamp = now;
				animation.elapsed += deltaTime;

				if (animation.elapsed >= duration) {
					finish(animation);
					return true;
				}

				const fraction = animation.elapsed / duration;
				animation.current =
					animation.startValue +
					(animation.toValue - animation.startValue) *
						animation.easing(fraction);
				if (animationProgress) {
					animationProgress.value.set(
						animationProgress.from +
							(animationProgress.to - animationProgress.from) * fraction,
					);
				}
				return false;
			}

			function onStart(
				animation: TimingAnimation,
				value: number,
				now: Timestamp,
				previousAnimation: TimingAnimation | undefined,
			): void {
				// Like Reanimated: a timing restarted towards the same value keeps its timeline.
				if (
					previousAnimation?.type === "timing" &&
					previousAnimation.toValue === toValue &&
					previousAnimation.lastTimestamp
				) {
					animation.startValue = previousAnimation.startValue;
					animation.elapsed = previousAnimation.elapsed;
					animation.lastTimestamp = previousAnimation.lastTimestamp;
					animation.startupFrames = previousAnimation.startupFrames;
				} else {
					animation.startValue = value;
					animation.elapsed = 0;
					animation.lastTimestamp = now;
					animation.startupFrames = 0;
					animationProgress?.value.set(animationProgress.from);
				}
				animation.current = value;
				animation.easing =
					typeof configEasing === "object"
						? configEasing.factory()
						: configEasing;
			}

			return {
				type: "timing",
				onFrame,
				onStart,
				toValue,
				current: toValue,
				startValue: 0,
				elapsed: 0,
				lastTimestamp: 0,
				startupFrames: 0,
				easing: () => 0,
				callback: ((finished?: boolean) => {
					"worklet";
					const didFinish = finished === true;
					callback?.({ finished: didFinish, settled: didFinish });
				}) as AnimationCallback,
				reduceMotion: getReduceMotionForAnimation(userConfig?.reduceMotion),
			} as unknown as TimingAnimation;
		},
		() => {
			"worklet";
			animationProgress?.value.set(animationProgress.to);
		},
	);
}) as unknown as withTimingType;
