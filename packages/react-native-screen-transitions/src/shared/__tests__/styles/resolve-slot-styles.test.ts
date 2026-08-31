import { describe, expect, it } from "bun:test";
import type { NormalizedTransitionInterpolatedStyle } from "../../types/animation.types";
import {
	resolveSlotStyles,
	reuseEqualResolvedSlots,
} from "../../providers/screen/styles/helpers/resolve-slot-styles";

const NO_ANCESTOR_STYLES: NormalizedTransitionInterpolatedStyle = {};
const NO_PREVIOUS_STYLE_STATES = {};

const createClip = ({
	x = 0,
	radius = 20,
}: {
	x?: number;
	radius?: number;
} = {}) => ({
	clip: {
		x,
		y: 0,
		width: 240,
		height: 360,
		radius,
		topLeftRadius: radius,
		topRightRadius: radius,
		bottomRightRadius: radius,
		bottomLeftRadius: radius,
		curve: "circular" as const,
	},
	contentTranslateX: -x,
	contentTranslateY: 0,
	contentScale: 1,
});

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

	it("takes the highest defined local clip wholesale without field merging", () => {
		const lowerClip = createClip({ radius: 28 });
		const higherClip = createClip({ x: 16, radius: 12 });

		const result = resolveSlotStyles({
			localStylesMaps: [
				{
					card: {
						style: { opacity: 0.4 },
						clip: lowerClip,
					},
				},
				{
					card: {
						style: { opacity: 0.9 },
						clip: higherClip,
					},
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: NO_PREVIOUS_STYLE_STATES,
		});

		expect(result.resolvedStylesMap.card?.clip).toBe(higherClip);
		expect(result.resolvedStylesMap.card?.style).toEqual({ opacity: 0.9 });
	});

	it("retains a lower-priority clip when higher layers do not define one", () => {
		const lowerClip = createClip();

		const result = resolveSlotStyles({
			localStylesMaps: [
				{ card: { clip: lowerClip } },
				{ card: { style: { opacity: 0.8 } } },
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: NO_PREVIOUS_STYLE_STATES,
		});

		expect(result.resolvedStylesMap.card?.clip).toBe(lowerClip);
	});

	it("carries measured bounds local transforms through slot resolution", () => {
		const result = resolveSlotStyles({
			localStylesMaps: [
				{
					card: {
						style: {
							transform: [{ translateX: 24 }],
						},
						boundsLocalTransform: [{ scale: 0.58 }],
					},
				},
			],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: NO_PREVIOUS_STYLE_STATES,
		});

		expect(result.resolvedStylesMap.card).toEqual({
			style: {
				transform: [{ translateX: 24 }],
			},
			boundsLocalTransform: [{ scale: 0.58 }],
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

	it("inherits a custom clip but keeps reserved clip slots local", () => {
		const cardClip = createClip({ radius: 30 });
		const contentClip = createClip({ radius: 0 });

		const result = resolveSlotStyles({
			localStylesMaps: [],
			ancestorStylesMap: {
				card: { clip: cardClip },
				content: { clip: contentClip },
			},
			previousStyleStatesBySlot: NO_PREVIOUS_STYLE_STATES,
		});

		expect(result.resolvedStylesMap.card?.clip).toBe(cardClip);
		expect(result.resolvedStylesMap.content).toBeUndefined();
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

	it("emits an explicit restore-base marker when a clip disappears", () => {
		const initial = resolveSlotStyles({
			localStylesMaps: [{ card: { clip: createClip() } }],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: NO_PREVIOUS_STYLE_STATES,
		});

		const next = resolveSlotStyles({
			localStylesMaps: [],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: initial.nextPreviousStyleStatesBySlot,
		});

		expect(next.resolvedStylesMap.card).toEqual({
			clip: null,
		});
		expect(next.nextPreviousStyleStatesBySlot).toEqual({});

		const settled = resolveSlotStyles({
			localStylesMaps: [],
			ancestorStylesMap: NO_ANCESTOR_STYLES,
			previousStyleStatesBySlot: next.nextPreviousStyleStatesBySlot,
		});

		expect(settled.resolvedStylesMap.card).toBeUndefined();
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

	it("reuses slots with equal canonical clip values", () => {
		const previousClip = createClip({ x: 8, radius: 18 });
		const nextClip = createClip({ x: 8, radius: 18 });
		const previous = { card: { clip: previousClip } };
		const next = { card: { clip: nextClip } };

		const reused = reuseEqualResolvedSlots({
			resolvedStylesMap: next,
			previousResolvedStylesMap: previous,
		});

		expect(reused).toBe(previous);
		expect(reused.card?.clip).toBe(previousClip);
	});

	it("reuses semantically equal clips with different overridden shorthands", () => {
		const previousClip = createClip({ radius: 18 });
		const nextClip = {
			...createClip({ radius: 99 }),
			clip: {
				...createClip({ radius: 99 }).clip,
				topLeftRadius: 18,
				topRightRadius: 18,
				bottomRightRadius: 18,
				bottomLeftRadius: 18,
			},
		};
		const previous = { card: { clip: previousClip } };
		const next = { card: { clip: nextClip } };

		const reused = reuseEqualResolvedSlots({
			resolvedStylesMap: next,
			previousResolvedStylesMap: previous,
		});

		expect(reused).toBe(previous);
		expect(reused.card?.clip).toBe(previousClip);
	});

	it("does not reuse slots when a canonical clip channel changes", () => {
		const previous = { card: { clip: createClip({ radius: 18 }) } };
		const next = { card: { clip: createClip({ radius: 19 }) } };

		const reused = reuseEqualResolvedSlots({
			resolvedStylesMap: next,
			previousResolvedStylesMap: previous,
		});

		expect(reused).not.toBe(previous);
		expect(reused.card).toBe(next.card);
	});
});
