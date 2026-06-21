import { describe, expect, test } from "bun:test";
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
});
