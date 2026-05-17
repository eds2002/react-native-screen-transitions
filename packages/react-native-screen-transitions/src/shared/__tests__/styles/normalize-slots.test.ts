import { describe, expect, it } from "bun:test";
import { normalizeSlots } from "../../providers/screen/styles/helpers/normalize-slots";

describe("normalizeSlots", () => {
	it("wraps shorthand slot styles", () => {
		const content = {
			opacity: 0.5,
			transform: [{ scale: 0.9 }],
		};

		const normalized = normalizeSlots({
			content,
		});

		expect(normalized).toEqual({
			content: {
				style: content,
			},
		});
	});

	it("passes through explicit style and props slots", () => {
		const backdrop = {
			style: {
				opacity: 0.5,
			},
			props: {
				intensity: 80,
			},
		};

		const normalized = normalizeSlots({
			backdrop,
		});

		expect(normalized.backdrop).toBe(backdrop);
	});

	it("returns the raw map when every slot is already explicit", () => {
		const raw = {
			content: {
				style: { opacity: 1 },
			},
			backdrop: {
				props: { intensity: 40 },
			},
			hero: undefined,
		};

		const normalized = normalizeSlots(raw);

		expect(normalized).toBe(raw);
	});

	it("handles canonical and shorthand keys together", () => {
		const content = {
			style: { opacity: 1 },
			props: { intensity: 60 },
		};
		const backdrop = { opacity: 0.35 };
		const hero = {
			transform: [{ translateY: 20 }],
		};

		const normalized = normalizeSlots({
			content,
			backdrop,
			hero,
		});

		expect(normalized).toEqual({
			content,
			backdrop: {
				style: backdrop,
			},
			hero: {
				style: hero,
			},
		});
	});
});
