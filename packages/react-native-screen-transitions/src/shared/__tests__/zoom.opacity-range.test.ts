import { describe, expect, it } from "bun:test";
import { resolveOpacityRangeTuple } from "../utils/bounds/zoom/math";

describe("resolveOpacityRangeTuple", () => {
	it("inherits default output values when only input stops are overridden", () => {
		expect(
			resolveOpacityRangeTuple({
				value: [0.1, 0.4],
				fallback: [0, 0.5, 0, 1],
			}),
		).toEqual({
			inputStart: 0.1,
			inputEnd: 0.4,
			outputStart: 0,
			outputEnd: 1,
		});
	});

	it("supports fully custom output ranges", () => {
		expect(
			resolveOpacityRangeTuple({
				value: [1.2, 1.9, 0.85, 0.15],
				fallback: [1, 2, 1, 0],
			}),
		).toEqual({
			inputStart: 1.2,
			inputEnd: 1.9,
			outputStart: 0.85,
			outputEnd: 0.15,
		});
	});
});
