import { describe, expect, it } from "bun:test";
import { resolveEnteringHandoffTarget } from "../../components/boundary/portal/utils/handoff-target";
import type { LinkPairsState } from "../../stores/bounds/types";

const createPairsState = ({
	destinationHandoff = true,
	sourceHandoff = true,
}: {
	destinationHandoff?: boolean;
	sourceHandoff?: boolean;
} = {}): LinkPairsState => ({
	"screen-a<>screen-b": {
		groups: {},
		links: {
		card: {
			status: "complete",
			source: {
				screenKey: "screen-a",
				bounds: { height: 100, pageX: 0, pageY: 0, width: 100 },
				styles: {},
				handoff: sourceHandoff || undefined,
			},
			destination: {
				screenKey: "screen-b",
				bounds: { height: 100, pageX: 0, pageY: 0, width: 100 },
				styles: {},
				handoff: destinationHandoff || undefined,
			},
		},
		},
	},
});

describe("entering handoff target", () => {
	it("attaches A's payload to B as soon as B's animation starts", () => {
		const pairsState = createPairsState();
		const resolve = (animationProgress: number) =>
			resolveEnteringHandoffTarget({
				animationProgress,
				boundaryId: "card",
				currentScreenKey: "screen-a",
				pairsState,
				sourcePairKey: "screen-a<>screen-b",
			});

		expect(resolve(0)).toBeNull();
		expect(resolve(0.001)).toBe("screen-b");
		expect(resolve(1)).toBe("screen-b");
	});

	it("requires both sides of the pair to opt into handoff", () => {
		const resolve = (pairsState: LinkPairsState) =>
			resolveEnteringHandoffTarget({
				animationProgress: 0.5,
				boundaryId: "card",
				currentScreenKey: "screen-a",
				pairsState,
				sourcePairKey: "screen-a<>screen-b",
			});

		expect(resolve(createPairsState({ sourceHandoff: false }))).toBeNull();
		expect(resolve(createPairsState({ destinationHandoff: false }))).toBeNull();
	});

	it("ignores a grouped boundary that is not the active destination", () => {
		const pairsState = createPairsState();
		const link = pairsState["screen-a<>screen-b"].links.card;
		link.group = "videos";
		pairsState["screen-a<>screen-b"].groups.videos = {
			activeId: "another-card",
		};

		expect(
			resolveEnteringHandoffTarget({
				animationProgress: 0.5,
				boundaryId: "videos:card",
				currentScreenKey: "screen-a",
				pairsState,
				sourcePairKey: "screen-a<>screen-b",
			}),
		).toBeNull();
	});
});
