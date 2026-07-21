import { describe, expect, it } from "bun:test";
import { Zoom } from "../configs/specs";

describe("transition specs", () => {
	it("exposes the paired zoom transition spec", () => {
		expect(Zoom).toEqual({
			open: {
				stiffness: 1000,
				damping: 500,
				mass: 3,
				overshootClamping: false,
				restSpeedThreshold: 0.02,
			},
			close: {
				stiffness: 1100,
				damping: 98,
				mass: 3,
				overshootClamping: false,
				restSpeedThreshold: 0.02,
			},
		});
	});
});
