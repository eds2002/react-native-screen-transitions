import { describe, expect, test } from "bun:test";
import { getGestureResetSpec } from "../../providers/screen/gestures/shared/reset";
import { isSpringAnimationConfig } from "../../utils/animation/animate";
import { withInternalSpring } from "../../utils/animation/spring";

type SpringAnimationRuntime = {
	onStart: (
		animation: SpringAnimationRuntime,
		value: number,
		timestamp: number,
		previousAnimation: SpringAnimationRuntime | undefined,
	) => void;
	velocity: number;
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
});
