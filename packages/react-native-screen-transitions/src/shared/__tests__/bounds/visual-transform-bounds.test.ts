import { beforeEach, describe, expect, it } from "bun:test";
import type { MeasuredDimensions } from "react-native-reanimated";
import { BoundStore } from "../../stores/bounds";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import type { ResolvedTransitionPair } from "../../stores/bounds/types";
import { createBoundsAccessor } from "../../utils/bounds";
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

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

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

	it("carries the resolved endpoint transform through the public accessor", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		BoundStore.link.setSource(
			pairKey,
			"card",
			"screen-a",
			createBounds(20, 20, 100, 100),
		);
		BoundStore.link.setDestination(
			pairKey,
			"card",
			"screen-b",
			createBounds(250, 250, 100, 100),
			{ transform: [{ scale: 0.5 }] },
		);
		const bounds = createBoundsAccessor(
			() =>
				({
					previous: { route: { key: "screen-a" } },
					current: { route: { key: "screen-b" } },
					progress: 0.5,
					layouts: { screen: { width: 400, height: 800 } },
				}) as any,
		);
		const style = bounds("card").styles();

		expect(getBoundsLocalTransform(style)).toEqual([{ scale: 0.5 }]);
		expect(getBoundsLocalTransform(bounds("card").values() as any)).toBeUndefined();
	});
});
