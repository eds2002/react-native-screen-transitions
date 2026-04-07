import { describe, expect, it } from "bun:test";
import { normalizeInterpolatedStyle } from "../utils/normalize-interpolated-style";

describe("normalizeInterpolatedStyle", () => {
	it("wraps shorthand slot styles", () => {
		const content = {
			opacity: 0.5,
			transform: [{ scale: 0.9 }],
		};

		const normalized = normalizeInterpolatedStyle({
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

		const normalized = normalizeInterpolatedStyle({
			backdrop,
		});

		expect(normalized.backdrop).toBe(backdrop);
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

		const normalized = normalizeInterpolatedStyle({
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
