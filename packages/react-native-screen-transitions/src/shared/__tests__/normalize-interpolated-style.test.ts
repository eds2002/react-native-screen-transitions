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

		expect(normalized.wasLegacy).toBe(false);
		expect(normalized.result).toEqual({
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

		expect(normalized.wasLegacy).toBe(false);
		expect(normalized.result.backdrop).toBe(backdrop);
	});

	it("maps legacy flat keys onto canonical slots", () => {
		const contentStyle = { opacity: 1 };
		const backdropStyle = { opacity: 0.4 };
		const overlayStyle = { opacity: 0.2 };

		const normalized = normalizeInterpolatedStyle({
			contentStyle,
			backdropStyle,
			overlayStyle,
		});

		expect(normalized.wasLegacy).toBe(true);
		expect(normalized.result).toEqual({
			content: {
				style: contentStyle,
			},
			backdrop: {
				style: backdropStyle,
			},
		});
	});

	it("handles mixed canonical, legacy, and shorthand keys together", () => {
		const content = {
			style: { opacity: 1 },
			props: { intensity: 60 },
		};
		const backdropStyle = { opacity: 0.35 };
		const hero = {
			transform: [{ translateY: 20 }],
		};

		const normalized = normalizeInterpolatedStyle({
			content,
			backdropStyle,
			hero,
		});

		expect(normalized.wasLegacy).toBe(true);
		expect(normalized.result).toEqual({
			content,
			backdrop: {
				style: backdropStyle,
			},
			hero: {
				style: hero,
			},
		});
	});

	it("uses overlayStyle as the backdrop fallback when backdropStyle is absent", () => {
		const overlayStyle = { opacity: 0.25 };

		const normalized = normalizeInterpolatedStyle({
			overlayStyle,
		});

		expect(normalized.wasLegacy).toBe(true);
		expect(normalized.result).toEqual({
			backdrop: {
				style: overlayStyle,
			},
		});
	});
});
