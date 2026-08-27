import { describe, expect, it } from "bun:test";
import {
	getStepSnapProgressVelocityScale,
	resolveStepSnapProgress,
	resolveStepSnapTargets,
} from "../../../providers/screen/gestures/shared/snap-points";

describe("step snap behavior", () => {
	it("maps a complete drag range across a narrow adjacent interval", () => {
		expect(
			resolveStepSnapProgress({
				baseline: 0.9,
				normalizedDelta: 0.5,
				snapPoints: [0, 0.4, 0.9, 1],
			}),
		).toBeCloseTo(0.95, 5);

		expect(
			resolveStepSnapProgress({
				baseline: 0.9,
				normalizedDelta: 1,
				snapPoints: [0, 0.4, 0.9, 1],
			}),
		).toBe(1);
	});

	it("maps collapse movement only to the adjacent lower snap point", () => {
		expect(
			resolveStepSnapProgress({
				baseline: 0.9,
				normalizedDelta: -1,
				snapPoints: [0, 0.4, 0.9, 1],
			}),
		).toBe(0.4);

		expect(
			resolveStepSnapProgress({
				baseline: 0.9,
				normalizedDelta: -2,
				snapPoints: [0, 0.4, 0.9, 1],
			}),
		).toBe(0.4);
	});

	it("restricts release candidates to the starting and adjacent snap points", () => {
		expect(
			resolveStepSnapTargets({
				baseline: 0.9,
				direction: 1,
				snapPoints: [0, 0.4, 0.9, 1],
			}),
		).toEqual([0.9, 1]);

		expect(
			resolveStepSnapTargets({
				baseline: 0.9,
				direction: -1,
				snapPoints: [0, 0.4, 0.9, 1],
			}),
		).toEqual([0.4, 0.9]);
	});

	it("keeps the current snap point when there is no adjacent target", () => {
		expect(
			resolveStepSnapProgress({
				baseline: 1,
				normalizedDelta: 0.5,
				snapPoints: [0, 0.4, 0.9, 1],
			}),
		).toBe(1);

		expect(
			resolveStepSnapTargets({
				baseline: 1,
				direction: 1,
				snapPoints: [0, 0.4, 0.9, 1],
			}),
		).toEqual([1]);
	});

	it("scales release progress velocity to the adjacent interval", () => {
		expect(getStepSnapProgressVelocityScale([0.9, 1])).toBeCloseTo(0.1, 5);
		expect(getStepSnapProgressVelocityScale([0.4])).toBe(0);
	});
});
