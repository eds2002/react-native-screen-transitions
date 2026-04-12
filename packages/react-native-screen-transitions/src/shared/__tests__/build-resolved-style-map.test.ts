import { describe, expect, it } from "bun:test";
import { buildResolvedStyleMap } from "../providers/screen/styles/helpers/build-resolved-style-map";

const IDENTITY_TRANSFORM = [
	{ translateX: 0 },
	{ translateY: 0 },
	{ scaleX: 1 },
	{ scaleY: 1 },
];

describe("buildResolvedStyleMap", () => {
	it("resets lingering transform and stacking styles for layer slots", () => {
		const { resolvedStylesMap } = buildResolvedStyleMap({
			currentStylesMap: {},
			fallbackStylesMap: {},
			previousStyleKeysBySlot: {
				content: {
					transform: true,
					zIndex: true,
					elevation: true,
				},
			},
		});

		expect(resolvedStylesMap.content?.style).toEqual({
			transform: IDENTITY_TRANSFORM,
			zIndex: 0,
			elevation: 0,
		});
	});

	it("resets lingering transform and stacking styles for element slots", () => {
		const { resolvedStylesMap } = buildResolvedStyleMap({
			currentStylesMap: {},
			fallbackStylesMap: {},
			previousStyleKeysBySlot: {
				artwork: {
					transform: true,
					zIndex: true,
					elevation: true,
				},
			},
		});

		expect(resolvedStylesMap.artwork?.style).toEqual({
			transform: IDENTITY_TRANSFORM,
			zIndex: 0,
			elevation: 0,
		});
	});

	it("does not emit resets for non-transition style keys", () => {
		const { resolvedStylesMap } = buildResolvedStyleMap({
			currentStylesMap: {},
			fallbackStylesMap: {},
			previousStyleKeysBySlot: {
				content: {
					backgroundColor: true,
					borderRadius: true,
					opacity: true,
				},
			},
		});

		expect(resolvedStylesMap.content).toBeUndefined();
	});

	it("does not track non-resettable keys between frames", () => {
		const { resolvedStylesMap, nextPreviousStyleKeysBySlot } =
			buildResolvedStyleMap({
				currentStylesMap: {
					content: {
						style: {
							backgroundColor: "red",
							opacity: 0.8,
						},
					},
				},
				fallbackStylesMap: {},
				previousStyleKeysBySlot: {},
			});

		expect(resolvedStylesMap.content?.style).toEqual({
			backgroundColor: "red",
			opacity: 0.8,
		});
		expect(nextPreviousStyleKeysBySlot.content).toBeUndefined();
	});
});
