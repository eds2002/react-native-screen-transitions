import { describe, expect, it } from "bun:test";
import {
	applyPowerCurve,
	clamp,
	clamp01,
	combineScales,
	compensateTranslationForParentScale,
	composeCompensatedTranslation,
	computeCenterScaleShift,
	inverseLerp,
	lerp,
	mapRangeClamped,
	normalizedToScale,
	normalizedToTranslation,
	safeDivide,
} from "../utils/bounds/helpers/math";

describe("bounds math helpers", () => {
	it("clamps numbers within a range", () => {
		expect(clamp(2, 0, 1)).toBe(1);
		expect(clamp(-2, 0, 1)).toBe(0);
		expect(clamp(0.25, 0, 1)).toBe(0.25);
		expect(clamp(0.25, 1, 0)).toBe(0.25);
	});

	it("provides stable range and interpolation primitives", () => {
		expect(clamp01(2)).toBe(1);
		expect(lerp(10, 20, 0.5)).toBe(15);
		expect(inverseLerp(15, 10, 20)).toBe(0.5);
		expect(mapRangeClamped(2, 0, 1, 10, 20)).toBe(20);
		expect(safeDivide(10, 0, -1)).toBe(-1);
	});

	it("maps normalized gesture values to translation", () => {
		expect(
			normalizedToTranslation({
				normalized: 0.5,
				dimension: 400,
				resistance: 0.4,
			}),
		).toBe(80);
		expect(
			normalizedToTranslation({
				normalized: -0.25,
				dimension: 800,
				resistance: 0.5,
			}),
		).toBe(-100);
	});

	it("maps normalized gesture values to scale", () => {
		expect(
			normalizedToScale({
				normalized: 0,
				outputRange: [1, 0.25],
				exponent: 2,
			}),
		).toBe(1);
		expect(
			normalizedToScale({
				normalized: 1,
				outputRange: [1, 0.25],
				exponent: 2,
			}),
		).toBeCloseTo(0.0625, 5);
		expect(
			normalizedToScale({
				normalized: -1,
				outputRange: [1, 0.25],
				exponent: 2,
			}),
		).toBe(1);
	});

	it("handles nonlinear curves and scale combinations", () => {
		expect(applyPowerCurve(-0.5, 2)).toBe(-0.25);
		expect(combineScales(0.8, 0.5)).toBe(0.4);
		expect(combineScales(0.8, 0.5, "average")).toBe(0.65);
	});

	it("compensates translation for parent scaling and center shift", () => {
		expect(
			compensateTranslationForParentScale({
				translation: 8,
				parentScale: 0.95,
				epsilon: 1e-5,
			}),
		).toBeCloseTo(8 / 0.95, 5);

		expect(
			computeCenterScaleShift({
				center: 600,
				containerCenter: 400,
				scale: 0.7,
			}),
		).toBeCloseTo(-60, 5);

		expect(
			composeCompensatedTranslation({
				gesture: 8,
				parentScale: 0.95,
				centerShift: -2,
				epsilon: 1e-5,
			}),
		).toBeCloseTo(8 / 0.95 - 2, 5);
	});
});
