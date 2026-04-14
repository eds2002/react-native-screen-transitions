import { describe, expect, it } from "bun:test";
import { resolveSlotStyles } from "../providers/screen/styles/helpers/resolve-slot-styles";

const IDENTITY_TRANSFORM = [
	{ translateX: 0 },
	{ translateY: 0 },
	{ scaleX: 1 },
	{ scaleY: 1 },
];

const ALL_RESETTABLE_STYLE_STATES = {
	hasTransform: true,
	hasOpacity: true,
	hasZIndex: true,
	hasElevation: true,
};

describe("resolveSlotStyles", () => {
	it("resets lingering transform and stacking styles for layer slots", () => {
		const { resolvedStylesMap } = resolveSlotStyles({
			currentStylesMap: {},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: {
				content: ALL_RESETTABLE_STYLE_STATES,
			},
		});

		expect(resolvedStylesMap.content?.style).toEqual({
			transform: IDENTITY_TRANSFORM,
			opacity: 1,
			zIndex: 0,
			elevation: 0,
		});
	});

	it("resets lingering transform and stacking styles for element slots", () => {
		const { resolvedStylesMap } = resolveSlotStyles({
			currentStylesMap: {},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: {
				artwork: ALL_RESETTABLE_STYLE_STATES,
			},
		});

		expect(resolvedStylesMap.artwork?.style).toEqual({
			transform: IDENTITY_TRANSFORM,
			opacity: 1,
			zIndex: 0,
			elevation: 0,
		});
	});

	it("does not emit resets when no tracked resettable keys exist", () => {
		const { resolvedStylesMap } = resolveSlotStyles({
			currentStylesMap: {},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: {},
		});

		expect(resolvedStylesMap.content).toBeUndefined();
	});

	it("does not track unrelated style keys between frames", () => {
		const { resolvedStylesMap, nextPreviousStyleStatesBySlot } =
			resolveSlotStyles({
				currentStylesMap: {
					content: {
						style: {
							backgroundColor: "red",
							borderRadius: 12,
						},
					},
				},
				ancestorStylesMap: {},
				previousStyleStatesBySlot: {},
			});

		expect(resolvedStylesMap.content?.style).toEqual({
			backgroundColor: "red",
			borderRadius: 12,
		});
		expect(nextPreviousStyleStatesBySlot.content).toBeUndefined();
	});

	it("resets lingering opacity back to visible when a slot stops returning it", () => {
		const { resolvedStylesMap } = resolveSlotStyles({
			currentStylesMap: {},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: {
				content: {
					hasTransform: false,
					hasOpacity: true,
					hasZIndex: false,
					hasElevation: false,
				},
			},
		});

		expect(resolvedStylesMap.content?.style).toEqual({
			opacity: 1,
		});
	});

	it("forwards the existing slot object when no reset patch is needed", () => {
		const content = {
			style: {
				opacity: 0.8,
			},
			props: {
				intensity: 40,
			},
		};

		const { resolvedStylesMap } = resolveSlotStyles({
			currentStylesMap: {
				content,
			},
			ancestorStylesMap: {},
			previousStyleStatesBySlot: {},
		});

		expect(resolvedStylesMap.content).toBe(content);
	});
});
