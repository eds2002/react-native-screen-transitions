import { describe, expect, it } from "bun:test";
import type { MeasuredDimensions } from "react-native-reanimated";
import type { ResolvedTransitionPair } from "../../stores/bounds/types";
import { computeBoundStyles } from "../../utils/bounds/helpers/styles/compute";
import { getBoundsLocalTransform } from "../../utils/bounds/helpers/styles/local-transform";

const createBounds = (
	x: number,
	y: number,
	width: number,
	height: number,
): MeasuredDimensions => ({
	x,
	y,
	pageX: x,
	pageY: y,
	width,
	height,
});

const createPair = (
	destinationBounds: MeasuredDimensions,
	styles: {
		sourceStyles?: ResolvedTransitionPair["sourceStyles"];
		destinationStyles?: ResolvedTransitionPair["destinationStyles"];
	} = {},
): ResolvedTransitionPair => ({
	sourceBounds: createBounds(20, 20, 100, 100),
	destinationBounds,
	sourceStyles: styles.sourceStyles ?? {},
	destinationStyles: styles.destinationStyles ?? {},
	sourceScreenKey: "screen-a",
	destinationScreenKey: "screen-b",
});

const computeExitRaw = (
	pair: ResolvedTransitionPair,
): { scaleX: number; scaleY: number } =>
	computeBoundStyles(
		{
			id: "card",
			current: { route: { key: "screen-b" } },
			next: { route: { key: "screen-a" } },
			progress: 2,
			dimensions: { width: 400, height: 800 },
			interpolationProps: {} as never,
		},
		{ id: "card", raw: true },
		pair,
	) as { scaleX: number; scaleY: number };

describe("visual transform bounds", () => {
	it("does not apply style transform scale to already-measured visual bounds", () => {
		expect(
			computeExitRaw(createPair(createBounds(200, 200, 200, 200))),
		).toMatchObject({
			scaleX: 2,
			scaleY: 2,
		});

		expect(
			computeExitRaw(
				createPair(createBounds(250, 250, 100, 100), {
					destinationStyles: {
						transform: [{ scale: 0.5 }],
					},
				}),
			),
		).toMatchObject({
			scaleX: 1,
			scaleY: 1,
		});
	});

	it("carries the measured endpoint transform for slot composition", () => {
		const style = computeBoundStyles(
			{
				id: "card",
				current: { route: { key: "screen-b" } },
				next: { route: { key: "screen-a" } },
				progress: 1.5,
				dimensions: { width: 400, height: 800 },
				interpolationProps: {} as never,
			},
			{ id: "card" },
			createPair(createBounds(250, 250, 100, 100), {
				sourceStyles: {
					transform: [{ scale: 0.5 }],
				},
			}),
		);

		expect(getBoundsLocalTransform(style)).toEqual([{ scale: 0.5 }]);
	});
});
