import { describe, expect, it } from "bun:test";
import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../types/animation.types";
import {
	type LocalStyleLayers,
	type ResettableStyleStatesBySlot,
	resolveSlotStyles,
} from "../../providers/screen/styles/helpers/resolve-slot-styles";

const IDENTITY_TRANSFORM = [
	{ translateX: 0 },
	{ translateY: 0 },
	{ scale: 1 },
	{ scaleX: 1 },
	{ scaleY: 1 },
];

const resolve = ({
	localStylesMaps,
	ancestorStylesMap = {},
	previousStyleStatesBySlot = {},
}: {
	localStylesMaps: LocalStyleLayers;
	ancestorStylesMap?: NormalizedTransitionInterpolatedStyle;
	previousStyleStatesBySlot?: ResettableStyleStatesBySlot;
}) =>
	resolveSlotStyles({
		localStylesMaps,
		ancestorStylesMap,
		previousStyleStatesBySlot,
	});

describe("resolveSlotStyles", () => {
	it("merges local slot layers in priority order and replaces transforms", () => {
		const result = resolve({
			localStylesMaps: [
				{
					card: {
						style: {
							opacity: 0.4,
							transform: [{ translateY: 320 }],
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
							transform: [{ scale: 0.8 }],
						},
						props: {
							testID: "merged-card",
						},
						boundsLocalTransform: [{ scale: 0.58 }],
					},
				},
			],
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
			boundsLocalTransform: [{ scale: 0.58 }],
		});
	});

	it("keeps the surviving transform layer without injecting an identity reset", () => {
		const initial = resolve({
			localStylesMaps: [
				{
					content: {
						style: {
							transform: [{ translateY: 320 }],
						},
					},
				},
				{
					content: {
						style: {
							transform: [{ scale: 0.9 }],
						},
					},
				},
			],
		});

		const next = resolve({
			localStylesMaps: [
				{
					content: {
						style: {
							transform: [{ translateY: 320 }],
						},
					},
				},
			],
			previousStyleStatesBySlot: initial.nextPreviousStyleStatesBySlot,
		});

		expect(next.resolvedStylesMap.content?.style).toEqual({
			transform: [{ translateY: 320 }],
		});
	});

	it("prefers local slots, inherits custom slots, and does not inherit reserved slots", () => {
		const result = resolve({
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
					},
				},
				inherited: {
					style: {
						opacity: 0.7,
					},
				},
				content: {
					style: {
						opacity: 0.4,
					},
				},
			},
		});

		expect(result.resolvedStylesMap.card?.style).toEqual({
			opacity: 0.8,
		});
		expect(result.resolvedStylesMap.inherited?.style).toEqual({
			opacity: 0.7,
		});
		expect(result.resolvedStylesMap.content).toBeUndefined();
	});

	describe("reserved slots", () => {
		const reservedSlotIds = [
			"content",
			"backdrop",
			"surface",
			NAVIGATION_MASK_CONTAINER_STYLE_ID,
			NAVIGATION_MASK_ELEMENT_STYLE_ID,
		];

		it("retains omitted styles without using animation progress as a reset boundary", () => {
			for (const slotId of reservedSlotIds) {
				const initial = resolve({
					localStylesMaps: [
						{
							[slotId]: {
								style: {
									backgroundColor: "black",
									opacity: 0.4,
								},
							},
						},
					],
				});

				const omitted = resolve({
					localStylesMaps: [],
					previousStyleStatesBySlot:
						initial.nextPreviousStyleStatesBySlot,
				});

				expect(omitted.resolvedStylesMap[slotId]).toBeUndefined();
				expect(omitted.nextPreviousStyleStatesBySlot[slotId]).toEqual(
					initial.nextPreviousStyleStatesBySlot[slotId],
				);
			}
		});

		it("retains omitted keys while continuing to forward keys that remain", () => {
			const initial = resolve({
				localStylesMaps: [
					{
						backdrop: {
							style: {
								backgroundColor: "black",
								opacity: 0.4,
							},
						},
					},
				],
			});

			const next = resolve({
				localStylesMaps: [
					{
						backdrop: {
							style: {
								opacity: 0.2,
							},
						},
					},
				],
				previousStyleStatesBySlot: initial.nextPreviousStyleStatesBySlot,
			});

			expect(next.resolvedStylesMap.backdrop?.style).toEqual({
				opacity: 0.2,
			});
			expect(
				next.nextPreviousStyleStatesBySlot.backdrop?.styleKeys,
			).toEqual({
				backgroundColor: true,
				opacity: true,
			});
		});

	});

	describe("custom slots", () => {
		it("resets a slot as soon as it disappears", () => {
			const initial = resolve({
				localStylesMaps: [
					{
						card: {
							style: {
								borderRadius: 24,
								opacity: 0.45,
							},
							props: {
								pointerEvents: "none",
							},
						},
					},
				],
			});

			const omitted = resolve({
				localStylesMaps: [],
				previousStyleStatesBySlot: initial.nextPreviousStyleStatesBySlot,
			});

			expect(omitted.resolvedStylesMap.card).toEqual({
				style: {
					borderRadius: 0,
					opacity: 1,
				},
				props: {
					pointerEvents: "auto",
				},
			});
			expect(omitted.nextPreviousStyleStatesBySlot).toEqual({});
		});

		it("resets only omitted keys while forwarding keys that remain", () => {
			const initial = resolve({
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
			});

			const next = resolve({
				localStylesMaps: [
					{
						card: {
							style: {
								opacity: 0.9,
							},
						},
					},
				],
				previousStyleStatesBySlot: initial.nextPreviousStyleStatesBySlot,
			});

			expect(next.resolvedStylesMap.card?.style).toEqual({
				borderRadius: 0,
				transform: IDENTITY_TRANSFORM,
				opacity: 0.9,
			});
		});

		it("resets an omitted group member while forwarding the next member", () => {
			const initial = resolve({
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
			});

			const next = resolve({
				localStylesMaps: [
					{
						"cards:sky": {
							style: {
								scale: 0.5,
							},
						},
					},
				],
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
	});
});
