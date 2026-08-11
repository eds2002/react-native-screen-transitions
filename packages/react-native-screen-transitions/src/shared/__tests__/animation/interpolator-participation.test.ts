import { describe, expect, it } from "bun:test";
import { shouldUpdateScreenInterpolator } from "../../providers/screen/animation/helpers/interpolator-participation";

describe("screen interpolator participation", () => {
	it("updates active, inert, and closing screens", () => {
		for (const activity of ["active", "inert", "closing"] as const) {
			expect(shouldUpdateScreenInterpolator(activity, false)).toBe(true);
		}
	});

	it("pauses inactive screens by default", () => {
		expect(shouldUpdateScreenInterpolator("inactive", false)).toBe(false);
	});

	it("allows inactive screens to opt into updates", () => {
		expect(shouldUpdateScreenInterpolator("inactive", true)).toBe(true);
	});
});
