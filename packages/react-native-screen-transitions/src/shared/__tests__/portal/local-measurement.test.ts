import { describe, expect, it } from "bun:test";
import { resolveBoundaryLocalMeasurement } from "../../components/boundary/portal/components/boundary-portal/helpers/local-measurement";

const bounds = {
	x: 10,
	y: 20,
	pageX: 30,
	pageY: 40,
	width: 100,
	height: 120,
};

describe("resolveBoundaryLocalMeasurement", () => {
	it("returns geometry captured for the active screen pair", () => {
		expect(
			resolveBoundaryLocalMeasurement(
				{ bounds, pairKey: "source<>destination" },
				"source<>destination",
			),
		).toBe(bounds);
	});

	it("rejects geometry retained from a previous screen pair", () => {
		expect(
			resolveBoundaryLocalMeasurement(
				{ bounds, pairKey: "previous<>destination" },
				"source<>destination",
			),
		).toBeNull();
	});
});
