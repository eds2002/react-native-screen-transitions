import { describe, expect, test } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import { isSpringAnimationConfig } from "../../utils/animation/animate";
import type { AnimationState } from "../../utils/animation/state";
import {
	type SpringConfig,
	withInternalSpring,
} from "../../utils/animation/spring";

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
