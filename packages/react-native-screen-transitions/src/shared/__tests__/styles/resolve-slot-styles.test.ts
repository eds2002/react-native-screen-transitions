import { describe, expect, it } from "bun:test";
import type { NormalizedTransitionInterpolatedStyle } from "../../types/animation.types";
import { resolveSlotStyles } from "../../providers/screen/styles/helpers/resolve-slot-styles";

const NO_ANCESTOR_STYLES: NormalizedTransitionInterpolatedStyle = {};
const NO_PREVIOUS_STYLE_STATES = {};

describe("resolveSlotStyles", () => {
	it("merges local layers for the same slot in priority order", () => {
		const result = resolveSlotStyles({
			localStylesMaps: [
				{
					card: {
						style: {
							opacity: 0.4,
							transform: [{ scale: 0.8 }],
						},
						props: {
							pointerEvents: "none",
						},
					},
				},
				{
					card: {
						style: {
							opacity: 0.9,
							borderRadius: 18,
						},
						props: {
							testID: "merged-card",
						},
					},
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: NO_PREVIOUS_STYLE_STATES,
		});

		expect(result.resolvedStylesMap.card).toEqual({
			style: {
				opacity: 0.9,
				transform: [{ scale: 0.8 }],
				borderRadius: 18,
			},
			props: {
				pointerEvents: "none",
				testID: "merged-card",
			},
		});
	});

	it("prefers local slots over inherited slots", () => {
		const result = resolveSlotStyles({
			localStylesMaps: [
				{
					card: {
						style: {
							opacity: 0.8,
						},
					},
				},
			],
			ancestorStylesMap: {
				card: {
					style: {
						opacity: 0.2,
						borderRadius: 12,
					},
				},
			},
			previousStyleStatesBySlot: NO_PREVIOUS_STYLE_STATES,
		});

		expect(result.resolvedStylesMap.card?.style).toEqual({
			opacity: 0.8,
		});
	});

	it("inherits custom slots when no local slot exists", () => {
		const result = resolveSlotStyles({
			localStylesMaps: [],
			ancestorStylesMap: {
				card: {
					style: {
						opacity: 0.7,
					},
					props: {
						pointerEvents: "box-none",
					},
				},
			},
			previousStyleStatesBySlot: NO_PREVIOUS_STYLE_STATES,
		});

		expect(result.resolvedStylesMap.card).toEqual({
			style: {
				opacity: 0.7,
			},
			props: {
				pointerEvents: "box-none",
			},
		});
	});

	it("does not inherit local-only screen slots", () => {
		const result = resolveSlotStyles({
			localStylesMaps: [],
			ancestorStylesMap: {
				content: {
					style: {
						opacity: 0.4,
					},
				},
				backdrop: {
					style: {
						opacity: 0.2,
					},
				},
			},
			previousStyleStatesBySlot: NO_PREVIOUS_STYLE_STATES,
		});

		expect(result.resolvedStylesMap.content).toBeUndefined();
		expect(result.resolvedStylesMap.backdrop).toBeUndefined();
	});

	it("resets previous slot keys when a slot disappears", () => {
		const initial = resolveSlotStyles({
			localStylesMaps: [
				{
					card: {
						style: {
							borderRadius: 24,
							opacity: 0.45,
						},
					},
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: NO_PREVIOUS_STYLE_STATES,
		});

		const next = resolveSlotStyles({
			localStylesMaps: [],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: initial.nextPreviousStyleStatesBySlot,
		});

		expect(next.resolvedStylesMap.card?.style).toEqual({
			borderRadius: 0,
			opacity: 1,
		});
		expect(next.nextPreviousStyleStatesBySlot).toEqual({});
	});

	it("keeps current slot values and resets only keys missing from them", () => {
		const initial = resolveSlotStyles({
			localStylesMaps: [
				{
					card: {
						style: {
							borderRadius: 24,
							opacity: 0.45,
							transform: [{ scale: 0.8 }],
						},
					},
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: NO_PREVIOUS_STYLE_STATES,
		});

		const next = resolveSlotStyles({
			localStylesMaps: [
				{
					card: {
						style: {
							opacity: 0.9,
						},
					},
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: initial.nextPreviousStyleStatesBySlot,
		});

		expect(next.resolvedStylesMap.card?.style).toEqual({
			borderRadius: 0,
			transform: [
				{ translateX: 0 },
				{ translateY: 0 },
				{ scale: 1 },
				{ scaleX: 1 },
				{ scaleY: 1 },
			],
			opacity: 0.9,
		});
	});

	it("resets the previous group member when a new group member becomes active", () => {
		const initial = resolveSlotStyles({
			localStylesMaps: [
				{
					"cards:lime": {
						style: {
							scale: 0.75,
							zIndex: 9,
						},
					},
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: NO_PREVIOUS_STYLE_STATES,
		});

		const next = resolveSlotStyles({
			localStylesMaps: [
				{
					"cards:sky": {
						style: {
							scale: 0.5,
						},
					},
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: initial.nextPreviousStyleStatesBySlot,
		});

		expect(next.resolvedStylesMap["cards:lime"]?.style).toEqual({
			scale: 1,
			zIndex: 0,
		});
		expect(next.resolvedStylesMap["cards:sky"]?.style).toEqual({
			scale: 0.5,
		});
	});

	it("resets prop keys independently from style keys", () => {
		const initial = resolveSlotStyles({
			localStylesMaps: [
				{
					card: {
						props: {
							pointerEvents: "none",
						},
					},
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: NO_PREVIOUS_STYLE_STATES,
		});

		const next = resolveSlotStyles({
			localStylesMaps: [],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: initial.nextPreviousStyleStatesBySlot,
		});

		expect(next.resolvedStylesMap.card?.props).toEqual({
			pointerEvents: "auto",
		});
	});
});
