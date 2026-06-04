import { describe, expect, test } from "bun:test";
import { getGestureResetSpec } from "../../providers/screen/gestures/shared/reset";
import { isSpringAnimationConfig } from "../../utils/animation/animate";
import type { AnimationState } from "../../utils/animation/state";
import { withInternalSpring } from "../../utils/animation/spring";

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
};

describe("isSpringAnimationConfig", () => {
	test("treats duration-only configs as timing configs", () => {
		expect(isSpringAnimationConfig(undefined)).toBe(false);
		expect(isSpringAnimationConfig({ duration: 220 })).toBe(false);
	});

	test("treats spring-specific keys as spring configs", () => {
		expect(isSpringAnimationConfig({ stiffness: 900, damping: 120 })).toBe(
			true,
		);
		expect(isSpringAnimationConfig({ duration: 550, dampingRatio: 1 })).toBe(
			true,
		);
		expect(isSpringAnimationConfig({ duration: 550, velocity: 1200 })).toBe(
			true,
		);
	});
});

describe("getGestureResetSpec", () => {
	test("injects release velocity into duration-based spring configs", () => {
		expect(getGestureResetSpec({ duration: 550, dampingRatio: 1 }, 1200)).toEqual(
			{
				duration: 550,
				dampingRatio: 1,
				velocity: 1200,
			},
		);
	});

	test("does not inject release velocity into timing configs", () => {
		expect(getGestureResetSpec({ duration: 220 }, 1200)).toEqual({
			duration: 220,
		});
	});
});

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
		expect(states).toEqual([]);

		while (!finished && timestamp < 4000) {
			timestamp += 16;
			finished = springAnimation.onFrame(springAnimation, timestamp);
		}
		springAnimation.callback?.(finished);

		expect(states).toContainEqual({
			finished: true,
			settled: true,
		});
	});
});
