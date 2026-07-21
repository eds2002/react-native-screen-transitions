import { describe, expect, it } from "bun:test";
import { normalizeSlots } from "../../providers/screen/styles/helpers/normalize-slots";
import {
	attachBoundsLocalTransform,
	BOUNDS_LOCAL_TRANSFORM_STYLE_KEY,
} from "../../utils/bounds/helpers/styles/local-transform";

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
});
