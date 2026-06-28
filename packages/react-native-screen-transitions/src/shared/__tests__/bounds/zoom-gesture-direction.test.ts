import { describe, expect, it } from "bun:test";
import { resolveZoomPanGestureDirection } from "../../utils/bounds/navigation/zoom/helpers";

describe("zoom gesture direction", () => {
	it("uses the dominant live vertical motion over a stale horizontal direction", () => {
		expect(
			resolveZoomPanGestureDirection({
				active: "horizontal",
				direction: "horizontal",
				normX: 0,
				normY: 0.2,
				rawNormX: 0,
				rawNormY: 0.2,
			}),
		).toBe("vertical");
	});

	it("uses the dominant live horizontal motion over a stale vertical direction", () => {
		expect(
			resolveZoomPanGestureDirection({
				active: "vertical",
				direction: "vertical",
				normX: -0.2,
				normY: 0,
				rawNormX: -0.2,
				rawNormY: 0,
			}),
		).toBe("horizontal-inverted");
	});

	it("keeps the stored direction when live motion does not contradict it", () => {
		expect(
			resolveZoomPanGestureDirection({
				active: "horizontal",
				direction: "horizontal",
				normX: 0.2,
				normY: 0.01,
				rawNormX: 0.2,
				rawNormY: 0.01,
			}),
		).toBe("horizontal");
	});

	it("infers direction from live motion when no pan direction is stored", () => {
		expect(
			resolveZoomPanGestureDirection({
				active: null,
				direction: null,
				normX: 0,
				normY: -0.2,
				rawNormX: 0,
				rawNormY: -0.2,
			}),
		).toBe("vertical-inverted");
	});
});
