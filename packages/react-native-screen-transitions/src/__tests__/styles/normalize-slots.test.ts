import { describe, expect, it } from "bun:test";
import { normalizeSlots } from "../../providers/orchestrator/styles/helpers/normalize-slots";

describe("normalizeSlots", () => {
	it("reuses already-normalized slots", () => {
		const raw = {
			card: {
				style: {
					opacity: 0.8,
				},
				props: {
					pointerEvents: "none",
				},
			},
		};

		expect(normalizeSlots(raw)).toBe(raw);
	});

	it("wraps style shorthand", () => {
		const style = { opacity: 0.8, transform: [{ translateX: 24 }] };
		expect(normalizeSlots({ card: style, gone: undefined })).toEqual({
			card: { style },
			gone: undefined,
		});
	});
});
