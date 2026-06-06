import { describe, expect, it } from "bun:test";
import type { NormalizedTransitionInterpolatedStyle } from "../../types/animation.types";
import { resolveSlotStyles } from "../../providers/screen/styles/helpers/resolve-slot-styles";

const NO_ANCESTOR_STYLES: NormalizedTransitionInterpolatedStyle = {};

describe("resolveSlotStyles", () => {
	it("resets a slot when the slot disappears from local interpolated styles", () => {
		const initial = resolveSlotStyles({
			localStylesMaps: [
				{
					card: {
						style: {
							borderRadius: 14,
							opacity: 0.4,
						},
						props: {
							pointerEvents: "none",
						},
					},
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: {},
		});

		const next = resolveSlotStyles({
			localStylesMaps: [
				{
					card: undefined,
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: initial.nextPreviousStyleStatesBySlot,
		});

		expect(next.resolvedStylesMap.card).toEqual({
			style: {
				borderRadius: 0,
				opacity: 1,
			},
			props: {
				pointerEvents: "auto",
			},
		});
		expect(next.nextPreviousStyleStatesBySlot).toEqual({});
	});

	it("resets removed keys when a slot still exists", () => {
		const initial = resolveSlotStyles({
			localStylesMaps: [
				{
					content: {
						style: {
							borderRadius: 16,
							opacity: 0.5,
						},
					},
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: {},
		});

		const next = resolveSlotStyles({
			localStylesMaps: [
				{
					content: {
						style: {
							opacity: 0.8,
						},
					},
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: initial.nextPreviousStyleStatesBySlot,
		});

		expect(next.resolvedStylesMap.content?.style).toEqual({
			borderRadius: 0,
			opacity: 0.8,
		});
	});

	it("resets dropped local keys when an inherited slot takes over", () => {
		const initial = resolveSlotStyles({
			localStylesMaps: [
				{
					shared: {
						style: {
							borderRadius: 20,
							opacity: 0.35,
						},
					},
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: {},
		});

		const next = resolveSlotStyles({
			localStylesMaps: [],
			ancestorStylesMap: {
				shared: {
					style: {
						opacity: 0.9,
					},
				},
			},
			previousStyleStatesBySlot: initial.nextPreviousStyleStatesBySlot,
		});

		expect(next.resolvedStylesMap.shared?.style).toEqual({
			borderRadius: 0,
			opacity: 0.9,
		});
	});
});
