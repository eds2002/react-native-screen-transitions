import { describe, expect, it } from "bun:test";
import { getRefreshBoundarySignal } from "../../components/boundary/utils/refresh-signals";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";

describe("refresh boundary signals", () => {
	it("keeps destination refreshes for close retargeting", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

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
			}),
		).toEqual({
			type: "destination",
			pairKey,
			signal: "destination|screen-a<>screen-b|screen-b|closing",
		});
	});
});
