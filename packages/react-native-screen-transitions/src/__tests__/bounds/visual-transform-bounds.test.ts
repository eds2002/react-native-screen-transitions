import { beforeEach, describe, expect, it } from "bun:test";
import type { MeasuredDimensions } from "react-native-reanimated";
import { BoundStore } from "./helpers/bound-store";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import { createBoundsAccessor } from "../../utils/bounds";
import { computeBoundStyles } from "../../utils/bounds/helpers/styles/compute";

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

const computeExitRaw = (
	destinationBounds: MeasuredDimensions,
	destinationStyles?: { transform: { scale: number }[] },
): { scaleX: number; scaleY: number } => {
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
		destinationBounds,
		destinationStyles,
	);
	return computeBoundStyles(
		{
			id: "card",
			current: { route: { key: "screen-a" } },
			next: { route: { key: "screen-b" } },
			progress: 2,
			dimensions: { width: 400, height: 800 },
			interpolationProps: {} as never,
		},
		{ id: "card", raw: true },
	) as { scaleX: number; scaleY: number };
};

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("visual transform bounds", () => {
	it("does not apply style transform scale to already-measured visual bounds", () => {
		expect(computeExitRaw(createBounds(200, 200, 200, 200))).toMatchObject({
			scaleX: 2,
			scaleY: 2,
		});

		expect(
			computeExitRaw(createBounds(250, 250, 100, 100), {
				transform: [{ scale: 0.5 }],
			}),
		).toMatchObject({
			scaleX: 1,
			scaleY: 1,
		});
	});

	it("resets styles while settled without changing raw values", () => {
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
			createBounds(200, 200, 200, 200),
		);
		const bounds = createBoundsAccessor(
			() =>
				({
					previous: { route: { key: "screen-a" } },
					current: { route: { key: "screen-b" } },
					active: { animating: 0 },
					progress: 1,
					layouts: { screen: { width: 400, height: 800 } },
				}) as any,
		);

		expect(bounds("card").styles()).toEqual({});
		expect(bounds("card").values()).toMatchObject({
			scaleX: 1,
			scaleY: 1,
		});
	});
});
