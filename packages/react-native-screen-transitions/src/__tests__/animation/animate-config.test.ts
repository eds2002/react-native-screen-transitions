import { describe, expect, test } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import { isSpringAnimationConfig } from "../../utils/animation/animate";
import type { AnimationState } from "../../utils/animation/state";
import {
	type SpringConfig,
	withInternalSpring,
} from "../../utils/animation/spring";
import { withInternalTiming } from "../../utils/animation/timing/timing";

type SpringAnimationRuntime = {
	onStart: (
		animation: SpringAnimationRuntime,
		value: number,
		timestamp: number,
		previousAnimation: SpringAnimationRuntime | undefined,
	) => void;
	onFrame: (animation: SpringAnimationRuntime, timestamp: number) => boolean;
	callback?: (finished?: boolean) => void;
	velocity: number;
	settled: boolean;
	animationProgressElapsed: number;
	animationProgressDuration: number;
};

const shared = <T>(initialValue: T): SharedValue<T> => {
	let value = initialValue;
	return {
		get: () => value,
		set: (nextValue: T) => {
			value = nextValue;
		},
		value,
	} as SharedValue<T>;
};

describe("internal withSpring", () => {
	test("a stall before its first frames is not billed to the motion (heavy screen mounting)", () => {
		const make = () => {
			const definition = withInternalSpring(1, { stiffness: 1000, damping: 500, mass: 3 }) as unknown;
			const animation = (typeof definition === "function" ? definition() : definition) as SpringAnimationRuntime & { current: number };
			animation.onStart(animation, 0, 0, undefined);
			return animation;
		};
		const frame = 1000 / 60;
		// Normal start: one frame per vsync.
		const normal = make();
		normal.onFrame(normal, frame);
		// The UI thread was busy for four frames before the first frame ran.
		const stalled = make();
		stalled.onFrame(stalled, frame * 5);
		expect(stalled.current).toBeCloseTo(normal.current, 6);
		// After the first frames, a long frame advances by its real duration (up to the 64 ms cap) again.
		for (let i = 2; i <= 3; i++) {
			normal.onFrame(normal, frame * i);
			stalled.onFrame(stalled, frame * (i + 4));
		}
		const before = stalled.current;
		stalled.onFrame(stalled, frame * 7 + 48);
		const longStep = stalled.current - before;
		const beforeNormal = normal.current;
		normal.onFrame(normal, frame * 4);
		expect(longStep).toBeGreaterThan((normal.current - beforeNormal) * 2);
	});

	test("keeps release velocity that initially points away from the target", () => {
		const definition = withInternalSpring(0, { velocity: 2500 }) as unknown;
		const animation =
			typeof definition === "function" ? definition() : definition;
		const springAnimation = animation as SpringAnimationRuntime;

		springAnimation.onStart(springAnimation, 120, 0, undefined);

		expect(springAnimation.velocity).toBe(2500);
	});

	test("tracks visual settlement before final spring completion", () => {
		const states: AnimationState[] = [];
		const definition = withInternalSpring(
			0,
			{},
			(state) => {
				states.push(state);
			},
		) as unknown;
		const animation =
			typeof definition === "function" ? definition() : definition;
		const springAnimation = animation as SpringAnimationRuntime;

		springAnimation.onStart(springAnimation, 1, 0, undefined);

		let timestamp = 0;
		let finished = false;
		while (timestamp < 2000) {
			timestamp += 16;
			finished = springAnimation.onFrame(springAnimation, timestamp);

			if (springAnimation.settled) {
				break;
			}

			if (finished) {
				break;
			}
		}

		expect(finished).toBe(false);
		expect(springAnimation.settled).toBe(true);
		expect(states).toEqual([
			{
				finished: false,
				settled: true,
			},
		]);

		while (!finished && timestamp < 4000) {
			timestamp += 16;
			finished = springAnimation.onFrame(springAnimation, timestamp);
		}
		springAnimation.callback?.(finished);

		expect(states).toEqual([
			{
				finished: false,
				settled: true,
			},
			{
				finished: true,
				settled: true,
			},
		]);
	});

	test.each([
		["a physics spring", { damping: 120, mass: 4, stiffness: 900 }],
		[
			"a physics spring with release velocity",
			{ damping: 120, mass: 4, stiffness: 900, velocity: 5 },
		],
		[
			"an overshoot-clamped spring",
			{
				damping: 10,
				mass: 1,
				overshootClamping: true,
				stiffness: 100,
			},
		],
		["a duration spring", { dampingRatio: 1, duration: 200 }],
		["an underdamped duration spring", { dampingRatio: 0.5, duration: 200 }],
	])(
		"drives linear closing animationProgress for %s",
		(_label, config) => {
			const animationProgress = shared(1);
			const definition = withInternalSpring(0, config, undefined, {
				value: animationProgress,
				from: 1,
				to: 0,
			}) as unknown;
			const animation =
				typeof definition === "function" ? definition() : definition;
			const springAnimation = animation as SpringAnimationRuntime;

			springAnimation.onStart(springAnimation, 1, 0, undefined);

			const expectedDuration = springAnimation.animationProgressDuration;
			expect(expectedDuration).toBeGreaterThan(0);
			expect(animationProgress.get()).toBe(1);

			let timestamp = 0;
			let finished = false;
			let previousProgress = 1;

			while (!finished && timestamp < 4000) {
				timestamp += 16;
				finished = springAnimation.onFrame(springAnimation, timestamp);
				const progress = animationProgress.get();

				expect(progress).toBeLessThanOrEqual(previousProgress);

				if (!finished) {
					const expected =
						1 -
						Math.min(
							springAnimation.animationProgressElapsed /
								springAnimation.animationProgressDuration,
							1 - 1e-6,
						);
					expect(progress).toBeCloseTo(expected, 8);
					expect(progress).toBeGreaterThan(0);
				}

				previousProgress = progress;
			}

			expect(finished).toBe(true);
			expect(timestamp).toBeGreaterThanOrEqual(expectedDuration);
			expect(timestamp - expectedDuration).toBeLessThanOrEqual(16);
			expect(animationProgress.get()).toBe(0);
		},
	);

	test("finishes animationProgress immediately when motion is reduced", () => {
		const animationProgress = shared(1);
		const definition = withInternalSpring(
			0,
			{
				reduceMotion: "always" as SpringConfig["reduceMotion"],
			},
			undefined,
			{
				value: animationProgress,
				from: 1,
				to: 0,
			},
		) as unknown;
		const animation =
			typeof definition === "function" ? definition() : definition;
		const springAnimation = animation as SpringAnimationRuntime;

		springAnimation.onStart(springAnimation, 1, 0, undefined);

		expect(animationProgress.get()).toBe(0);
		expect(springAnimation.onFrame(springAnimation, 0)).toBe(true);
	});
});

describe("internal withTiming", () => {
	type TimingRuntime = SpringAnimationRuntime & { current: number };
	const make = (config: { duration?: number; easing?: (t: number) => number }, clock?: SharedValue<number>) => {
		const definition = withInternalTiming(100, config, undefined, clock ? { value: clock, from: 0, to: 1 } : undefined) as unknown;
		const animation = (typeof definition === "function" ? definition() : definition) as TimingRuntime;
		animation.onStart(animation, 0, 0, undefined);
		return animation;
	};
	const linear = (t: number) => t;
	const frame = 1000 / 60;

	test("follows elapsed time through the easing, like Reanimated's withTiming", () => {
		const animation = make({ duration: 300, easing: linear });
		animation.onFrame(animation, frame);
		animation.onFrame(animation, frame * 2);
		animation.onFrame(animation, frame * 3);
		animation.onFrame(animation, 150);
		expect(animation.current).toBeCloseTo(50, 6);
		expect(animation.onFrame(animation, 300)).toBe(true);
		expect(animation.current).toBe(100);
	});

	test("a stall before its first frames is not billed to the motion", () => {
		const normal = make({ duration: 300, easing: linear });
		normal.onFrame(normal, frame);
		const stalled = make({ duration: 300, easing: linear });
		stalled.onFrame(stalled, frame * 5);
		expect(stalled.current).toBeCloseTo(normal.current, 6);
	});

	test("a new timing towards the same value after one finished starts from the beginning", () => {
		const finished = make({ duration: 100, easing: linear });
		finished.onFrame(finished, 100);
		const definition = withInternalTiming(100, { duration: 100, easing: linear }) as unknown;
		const next = (typeof definition === "function" ? definition() : definition) as TimingRuntime;
		next.onStart(next, 0, 200, finished);
		next.onFrame(next, 200 + frame);
		expect(next.current).toBeLessThan(100);
	});

	test("drives the linear progress clock from the same frames and finishes it", () => {
		const clock = shared(0);
		const animation = make({ duration: 200, easing: (t) => t * t }, clock);
		animation.onFrame(animation, frame);
		animation.onFrame(animation, frame * 2);
		animation.onFrame(animation, frame * 3);
		animation.onFrame(animation, 100);
		expect(clock.get()).toBeCloseTo(0.5, 6);
		expect(animation.current).toBeCloseTo(25, 6);
		animation.onFrame(animation, 200);
		expect(clock.get()).toBe(1);
	});
});
