import { describe, expect, it } from "bun:test";
import { resolveDirectionalDragTranslation } from "../utils/bounds/zoom/math";

describe("resolveDirectionalDragTranslation", () => {
	it("matches the previous symmetric translation when multipliers are 1", () => {
		expect(
			resolveDirectionalDragTranslation({
				normalized: 0.5,
				dimension: 100,
				resistance: 0.4,
				negativeMax: 1,
				positiveMax: 1,
			}),
		).toBe(20);

		expect(
			resolveDirectionalDragTranslation({
				normalized: -0.5,
				dimension: 100,
				resistance: 0.4,
				negativeMax: 1,
				positiveMax: 1,
			}),
		).toBe(-20);
	});

	it("supports disabling an axis by using zero multipliers", () => {
		expect(
			resolveDirectionalDragTranslation({
				normalized: 1,
				dimension: 100,
				resistance: 0.4,
				negativeMax: 0,
				positiveMax: 0,
			}),
		).toBe(0);
	});

	it("supports asymmetric per-direction intensities", () => {
		expect(
			resolveDirectionalDragTranslation({
				normalized: -1,
				dimension: 100,
				resistance: 0.4,
				negativeMax: 0.5,
				positiveMax: 1.25,
			}),
		).toBe(-20);

		expect(
			resolveDirectionalDragTranslation({
				normalized: 1,
				dimension: 100,
				resistance: 0.4,
				negativeMax: 0.5,
				positiveMax: 1.25,
			}),
		).toBe(50);
	});

	it("supports exponent-based damping", () => {
		expect(
			resolveDirectionalDragTranslation({
				normalized: 0.5,
				dimension: 100,
				resistance: 0.4,
				negativeMax: 1,
				positiveMax: 1,
				exponent: 2,
			}),
		).toBe(10);
	});
});
