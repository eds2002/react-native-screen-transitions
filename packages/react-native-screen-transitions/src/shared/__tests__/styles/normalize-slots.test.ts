import { describe, expect, it } from "bun:test";
import { normalizeSlots } from "../../providers/screen/styles/helpers/normalize-slots";
import {
	attachBoundsLocalTransform,
	BOUNDS_LOCAL_TRANSFORM_STYLE_KEY,
} from "../../utils/bounds/helpers/styles/local-transform";
import { normalizeInterpolatedStyle } from "../../utils/normalize-interpolated-style";

const CLIP = {
	clip: {
		x: 12,
		y: 20,
		width: 240,
		height: 360,
		radius: 0,
		topLeftRadius: 24,
		topRightRadius: 20,
		bottomRightRadius: 16,
		bottomLeftRadius: 12,
		curve: "continuous" as const,
	},
	contentTranslateX: -12,
	contentTranslateY: -20,
	contentScale: 0.92,
};

describe("normalizeSlots", () => {
	it("reuses already-normalized slots when no bounds metadata is present", () => {
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

	it("recognizes a clip-only explicit slot and preserves its object identity", () => {
		const raw = {
			card: {
				clip: CLIP,
			},
		};

		const normalized = normalizeSlots(raw);

		expect(normalized).toBe(raw);
		expect(normalized.card?.clip).toBe(CLIP);
	});

	it("moves measured bounds local transforms out of native styles", () => {
		const style = attachBoundsLocalTransform(
			{
				opacity: 0.8,
				transform: [{ translateX: 24 }],
			},
			{ transform: [{ scale: 0.58 }] },
		);

		const normalized = normalizeSlots({ card: style });

		expect(normalized.card).toEqual({
			style: {
				opacity: 0.8,
				transform: [{ translateX: 24 }],
			},
			boundsLocalTransform: [{ scale: 0.58 }],
		});
		expect(
			BOUNDS_LOCAL_TRANSFORM_STYLE_KEY in
				(normalized.card?.style as Record<string, unknown>),
		).toBe(false);
	});

	it("keeps clip as a whole-object channel while extracting bounds metadata", () => {
		const style = attachBoundsLocalTransform(
			{ opacity: 0.8 },
			{ transform: [{ scale: 0.75 }] },
		);

		const normalized = normalizeSlots({
			card: {
				style,
				clip: CLIP,
			},
		});

		expect(normalized.card).toEqual({
			style: { opacity: 0.8 },
			clip: CLIP,
			boundsLocalTransform: [{ scale: 0.75 }],
		});
		expect(normalized.card?.clip).toBe(CLIP);
	});
});

describe("normalizeInterpolatedStyle", () => {
	it("treats clip as an explicit whole-object channel", () => {
		const explicitSlot = { clip: CLIP };

		const normalized = normalizeInterpolatedStyle({
			card: explicitSlot,
		}).result;

		expect(normalized.card).toBe(explicitSlot);
		expect(normalized.card?.clip).toBe(CLIP);
	});
});
