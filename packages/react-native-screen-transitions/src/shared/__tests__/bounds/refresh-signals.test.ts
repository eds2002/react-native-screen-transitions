import { beforeEach, describe, expect, it } from "bun:test";
import { getRefreshBoundarySignal } from "../../components/boundary/utils/refresh-signals";
import { BoundStore, type Snapshot } from "../../stores/bounds";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import { pairs } from "../../stores/bounds/internals/state";

const createBounds = (): Snapshot["bounds"] => ({
	x: 0,
	y: 0,
	pageX: 0,
	pageY: 0,
	width: 100,
	height: 100,
});

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("refresh boundary signals", () => {
	it("keeps destination refreshes for matched-screen portals after ownership can settle on the destination", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		BoundStore.link.setSource(
			pairKey,
			"card",
			"screen-a",
			createBounds(),
			{},
			undefined,
			"matched-screen",
		);

		expect(
			getRefreshBoundarySignal({
				enabled: true,
				currentScreenKey: "screen-b",
				destinationPairKey: pairKey,
				linkId: "card",
				shouldRefresh: true,
				closing: true,
				entering: false,
				animating: false,
				progress: 1,
				linkState: pairs.get(),
			}),
		).toEqual({
			type: "destination",
			pairKey,
			signal: "destination|screen-a<>screen-b|screen-b|closing",
		});
	});

	it("keeps destination refreshes for normal shared bounds", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		BoundStore.link.setSource(
			pairKey,
			"card",
			"screen-a",
			createBounds(),
			{},
			undefined,
			"screen",
		);

		expect(
			getRefreshBoundarySignal({
				enabled: true,
				currentScreenKey: "screen-b",
				destinationPairKey: pairKey,
				linkId: "card",
				shouldRefresh: true,
				closing: true,
				entering: false,
				animating: false,
				progress: 1,
				linkState: pairs.get(),
			}),
		).toEqual({
			type: "destination",
			pairKey,
			signal: "destination|screen-a<>screen-b|screen-b|closing",
		});
	});
});
