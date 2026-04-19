import { describe, expect, it } from "bun:test";
import {
	computeContentTransformGeometry,
	computeRelativeGeometry,
} from "../utils/bounds/helpers/geometry";

describe("computeRelativeGeometry", () => {
	it("calculates correct relative geometry when entering", () => {
		const start = {
			x: 10,
			y: 20,
			pageX: 10,
			pageY: 20,
			width: 100,
			height: 200,
		};
		const end = {
			x: 50,
			y: 100,
			pageX: 50,
			pageY: 100,
			width: 200,
			height: 400,
		};

		const result = computeRelativeGeometry({ start, end, entering: true });

		expect(result.dx).toBe(-90); // center diff X
		expect(result.dy).toBe(-180); // center diff Y
		expect(result.scaleX).toBe(0.5); // width ratio
		expect(result.scaleY).toBe(0.5); // height ratio
		expect(result.entering).toBe(true);
	});

	it("calculates correct relative geometry when exiting", () => {
		const start = { x: 0, y: 0, pageX: 10, pageY: 20, width: 100, height: 200 };
		const end = { x: 0, y: 0, pageX: 50, pageY: 100, width: 200, height: 400 };

		const result = computeRelativeGeometry({ start, end, entering: false });

		expect(result.entering).toBe(false);
	});
});

describe("computeContentTransformGeometry", () => {
	const dimensions = { width: 375, height: 812, scale: 1, fontScale: 1 };

	it("uniform chooses min scale when aspect ratio differs significantly", () => {
		const start = {
			x: 0,
			y: 0,
			pageX: 50,
			pageY: 100,
			width: 100,
			height: 100,
		};
		const end = { x: 0, y: 0, pageX: 100, pageY: 200, width: 200, height: 50 };

		const result = computeContentTransformGeometry({
			start,
			end,
			entering: true,
			dimensions,
			anchor: "center",
			scaleMode: "uniform",
		});

		expect(result.s).toBe(0.5);
		expect(result.entering).toBe(true);
	});

	it("calculates transform with match mode (average of sx/sy)", () => {
		const start = {
			x: 0,
			y: 0,
			pageX: 50,
			pageY: 100,
			width: 100,
			height: 100,
		};
		const end = { x: 0, y: 0, pageX: 100, pageY: 200, width: 200, height: 50 };

		const result = computeContentTransformGeometry({
			start,
			end,
			entering: true,
			dimensions,
			anchor: "center",
			// match mode uses the larger scale (cover strategy) so content fills the mask
			scaleMode: "match",
		});

		// sx = 100/200 = 0.5, sy = 100/50 = 2 -> max(0.5, 2) = 2
		expect(result.s).toBeCloseTo(2, 5);
	});

	it("uniform chooses max scale when aspect ratios are similar", () => {
		const start = { x: 0, y: 0, pageX: 0, pageY: 0, width: 100, height: 100 };
		const end = { x: 0, y: 0, pageX: 0, pageY: 0, width: 200, height: 195 };

		const result = computeContentTransformGeometry({
			start,
			end,
			entering: true,
			dimensions,
			anchor: "center",
			scaleMode: "uniform",
		});

		expect(result.s).toBeCloseTo(0.512, 2);
	});

	it("handles zero dimensions safely", () => {
		const start = { x: 0, y: 0, pageX: 0, pageY: 0, width: 0, height: 100 };
		const end = { x: 0, y: 0, pageX: 0, pageY: 0, width: 200, height: 200 };

		// Should not throw and use safe fallback
		const result = computeContentTransformGeometry({
			start,
			end,
			entering: true,
			dimensions,
			anchor: "center",
			scaleMode: "uniform",
		});

		expect(result.s).toBeDefined();
		expect(Number.isFinite(result.s)).toBe(true);
	});
});
