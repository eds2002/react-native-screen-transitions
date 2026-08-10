import { describe, expect, it } from "bun:test";
import {
	resolveActiveBoundaryPortalPairKey,
	resolveBoundaryLocalMeasurement,
} from "../../components/boundary/portal/components/boundary-portal/helpers/local-measurement";

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

describe("resolveActiveBoundaryPortalPairKey", () => {
	const measurement = { bounds, pairKey: "source<>destination" };
	const pairs = {
		"source<>destination": {
			groups: { cards: { activeId: "A", initialId: "A" } },
			links: {},
		},
	} as any;

	it("keeps the host mounted while the boundary slot is teleporting", () => {
		expect(
			resolveActiveBoundaryPortalPairKey(
				measurement,
				{ props: { teleport: true } },
				"cards:A",
				pairs,
			),
		).toBe(measurement.pairKey);
	});

	it("prepares only the active group member before its slot is published", () => {
		expect(
			resolveActiveBoundaryPortalPairKey(
				measurement,
				undefined,
				"cards:A",
				pairs,
			),
		).toBe(measurement.pairKey);
		expect(
			resolveActiveBoundaryPortalPairKey(
				measurement,
				undefined,
				"cards:B",
				pairs,
			),
		).toBeNull();
	});

	it("unmounts the host when teleportation settles", () => {
		expect(
			resolveActiveBoundaryPortalPairKey(
				measurement,
				{ props: { teleport: false } },
				"cards:A",
				pairs,
			),
		).toBeNull();
	});
});
