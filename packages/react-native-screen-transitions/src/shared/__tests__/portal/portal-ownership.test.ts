import { describe, expect, it } from "bun:test";
import {
	createScreenPairKey,
	getDestinationScreenKeyFromPairKey,
} from "../../stores/bounds/helpers/link-pairs.helpers";
import type {
	BoundsPortalHost,
	LinkPairsState,
	TagLink,
} from "../../stores/bounds/types";
import {
	canSwitchBoundaryLocalPortalHostImmediately,
	hasMatchedScreenPortalContinuation,
	resolveMatchedScreenPortalOwnership,
	usesScreenPortalHost,
} from "../../components/boundary/portal/utils/ownership";

const createBounds = (x = 0, y = 0, width = 100, height = 100) => ({
	x,
	y,
	pageX: x,
	pageY: y,
	width,
	height,
});

const completeLink = ({
	destinationScreenKey,
	portalHost,
	sourceScreenKey,
}: {
	destinationScreenKey: string;
	portalHost?: BoundsPortalHost;
	sourceScreenKey: string;
}): TagLink => ({
	status: "complete",
	source: {
		screenKey: sourceScreenKey,
		bounds: createBounds(),
		styles: {},
		portalHost,
	},
	destination: {
		screenKey: destinationScreenKey,
		bounds: createBounds(100, 100),
		styles: {},
	},
});

const sourceOnlyLink = ({
	portalHost,
	sourceScreenKey,
}: {
	portalHost?: BoundsPortalHost;
	sourceScreenKey: string;
}): TagLink => ({
	status: "destination-incomplete",
	source: {
		screenKey: sourceScreenKey,
		bounds: createBounds(),
		styles: {},
		portalHost,
	},
	destination: null,
});

const expectCompleteSignal = (
	signal: ReturnType<typeof resolveMatchedScreenPortalOwnership>,
) => {
	expect(signal.status).toBe("complete");
	if (signal.status !== "complete") {
		throw new Error("expected complete portal ownership signal");
	}

	expect(signal.hostScreenKey).toBe(
		getDestinationScreenKeyFromPairKey(signal.ownerPairKey),
	);

	return signal;
};

describe("portal host readiness", () => {
	it("waits for screen portal hosts", () => {
		const link = completeLink({
			sourceScreenKey: "a",
			destinationScreenKey: "b",
			portalHost: "screen",
		});

		expect(usesScreenPortalHost(link)).toBe(true);
	});

	it("does not wait for boundary-local portal hosts", () => {
		const link = completeLink({
			sourceScreenKey: "a",
			destinationScreenKey: "b",
			portalHost: "boundary-local",
		});

		expect(usesScreenPortalHost(link)).toBe(false);
	});

	it("ignores boundary-local portal continuations", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const linkState: LinkPairsState = {
			[abPairKey]: {
				groups: {},
				links: {
					video: completeLink({
						sourceScreenKey: "a",
						destinationScreenKey: "b",
						portalHost: "boundary-local",
					}),
				},
			},
		};

		expect(
			hasMatchedScreenPortalContinuation({
				linkKey: "video",
				linkState,
				sourceScreenKey: "b",
			}),
		).toBe(false);
	});

	it("keeps waiting for screen-level portal continuations", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const linkState: LinkPairsState = {
			[abPairKey]: {
				groups: {},
				links: {
					video: completeLink({
						sourceScreenKey: "a",
						destinationScreenKey: "b",
						portalHost: "screen",
					}),
				},
			},
		};

		expect(
			hasMatchedScreenPortalContinuation({
				linkKey: "video",
				linkState,
				sourceScreenKey: "b",
			}),
		).toBe(true);
	});
});

describe("canSwitchBoundaryLocalPortalHostImmediately", () => {
	it("immediately attaches retreated same-pair source hosts", () => {
		const abPairKey = createScreenPairKey("a", "b");

		expect(
			canSwitchBoundaryLocalPortalHostImmediately({
				hostScreenKey: "a",
				ownerPairKey: abPairKey,
				previousOwnerPairKey: abPairKey,
			}),
		).toBe(true);
	});

	it("immediately attaches when a pop contracts the chain to the previous source host", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const bcPairKey = createScreenPairKey("b", "c");

		expect(
			canSwitchBoundaryLocalPortalHostImmediately({
				hostScreenKey: "b",
				ownerPairKey: abPairKey,
				previousOwnerPairKey: bcPairKey,
			}),
		).toBe(true);
	});
});

describe("resolveMatchedScreenPortalOwnership", () => {
	it("keeps A as owner during A -> B flight", () => {
		const pairKey = createScreenPairKey("a", "b");
		const link = completeLink({
			sourceScreenKey: "a",
			destinationScreenKey: "b",
			portalHost: "boundary-local",
		});
		const signal = resolveMatchedScreenPortalOwnership({
			boundaryId: "video",
			isSettledHostReady: false,
			pairsState: {
				[pairKey]: {
					groups: {},
					links: { video: link },
				},
			},
			portalHost: "boundary-local",
			settledHostScreenKey: "b",
			sourcePairKey: pairKey,
		});

		expect(signal).toEqual({
			hostScreenKey: "b",
			ownerPairKey: pairKey,
			ownerScreenKey: "a",
			status: "complete",
		});
	});

	it("rebases ownership to B after A -> B settles", () => {
		const pairKey = createScreenPairKey("a", "b");
		const link = completeLink({
			sourceScreenKey: "a",
			destinationScreenKey: "b",
			portalHost: "boundary-local",
		});
		const signal = resolveMatchedScreenPortalOwnership({
			boundaryId: "video",
			isSettledHostReady: true,
			pairsState: {
				[pairKey]: {
					groups: {},
					links: { video: link },
				},
			},
			portalHost: "boundary-local",
			settledHostScreenKey: "b",
			sourcePairKey: pairKey,
		});

		expect(signal).toEqual({
			hostScreenKey: "b",
			ownerPairKey: pairKey,
			ownerScreenKey: "b",
			status: "complete",
		});
	});

	it("keeps screen-host portals source-owned after settle", () => {
		const pairKey = createScreenPairKey("a", "b");
		const link = completeLink({
			sourceScreenKey: "a",
			destinationScreenKey: "b",
			portalHost: "screen",
		});
		const signal = resolveMatchedScreenPortalOwnership({
			boundaryId: "video",
			isSettledHostReady: true,
			pairsState: {
				[pairKey]: {
					groups: {},
					links: { video: link },
				},
			},
			portalHost: "screen",
			settledHostScreenKey: "b",
			sourcePairKey: pairKey,
		});

		expect(signal).toEqual({
			hostScreenKey: "b",
			ownerPairKey: pairKey,
			ownerScreenKey: "a",
			status: "complete",
		});
	});

	it("uses B as owner during B -> C flight in an active chain", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const bcPairKey = createScreenPairKey("b", "c");
		const signal = expectCompleteSignal(resolveMatchedScreenPortalOwnership({
			boundaryId: "video",
			isSettledHostReady: true,
			pairsState: {
				[abPairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "a",
							destinationScreenKey: "b",
							portalHost: "boundary-local",
						}),
					},
				},
				[bcPairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "b",
							destinationScreenKey: "c",
							portalHost: "boundary-local",
						}),
					},
				},
			},
			portalHost: "boundary-local",
			settledHostScreenKey: "b",
			sourcePairKey: abPairKey,
		}));

		expect(signal).toEqual({
			hostScreenKey: "c",
			ownerPairKey: bcPairKey,
			ownerScreenKey: "b",
			status: "complete",
		});
	});

	it("rebases ownership to C after B -> C settles", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const bcPairKey = createScreenPairKey("b", "c");
		const signal = resolveMatchedScreenPortalOwnership({
			boundaryId: "video",
			isSettledHostReady: true,
			pairsState: {
				[abPairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "a",
							destinationScreenKey: "b",
							portalHost: "boundary-local",
						}),
					},
				},
				[bcPairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "b",
							destinationScreenKey: "c",
							portalHost: "boundary-local",
						}),
					},
				},
			},
			portalHost: "boundary-local",
			settledHostScreenKey: "c",
			sourcePairKey: abPairKey,
		});

		expect(signal).toEqual({
			hostScreenKey: "c",
			ownerPairKey: bcPairKey,
			ownerScreenKey: "c",
			status: "complete",
		});
	});

	it("preemptively returns to B when the settled C host finishes closing", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const bcPairKey = createScreenPairKey("b", "c");
		const pairsState: LinkPairsState = {
			[abPairKey]: {
				groups: {},
				links: {
					video: completeLink({
						sourceScreenKey: "a",
						destinationScreenKey: "b",
						portalHost: "boundary-local",
					}),
				},
			},
			[bcPairKey]: {
				groups: {},
				links: {
					video: completeLink({
						sourceScreenKey: "b",
						destinationScreenKey: "c",
						portalHost: "boundary-local",
					}),
				},
			},
		};
		const dismissedSignal = resolveMatchedScreenPortalOwnership({
			boundaryId: "video",
			isSettledHostClosingComplete: true,
			isSettledHostReady: false,
			pairsState,
			portalHost: "boundary-local",
			settledHostScreenKey: "c",
			sourcePairKey: abPairKey,
		});
		const contractedSignal = resolveMatchedScreenPortalOwnership({
			boundaryId: "video",
			isSettledHostReady: true,
			pairsState: {
				[abPairKey]: pairsState[abPairKey]!,
			},
			portalHost: "boundary-local",
			settledHostScreenKey: "b",
			sourcePairKey: abPairKey,
		});

		expect(dismissedSignal).toEqual({
			hostScreenKey: "b",
			ownerPairKey: bcPairKey,
			ownerScreenKey: "b",
			status: "complete",
		});
		expect(contractedSignal).toEqual({
			hostScreenKey: "b",
			ownerPairKey: abPairKey,
			ownerScreenKey: "b",
			status: "complete",
		});
	});

	it("preemptively returns to C when the settled D host finishes closing", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const bcPairKey = createScreenPairKey("b", "c");
		const cdPairKey = createScreenPairKey("c", "d");
		const pairsState: LinkPairsState = {
			[abPairKey]: {
				groups: {},
				links: {
					video: completeLink({
						sourceScreenKey: "a",
						destinationScreenKey: "b",
						portalHost: "boundary-local",
					}),
				},
			},
			[bcPairKey]: {
				groups: {},
				links: {
					video: completeLink({
						sourceScreenKey: "b",
						destinationScreenKey: "c",
						portalHost: "boundary-local",
					}),
				},
			},
			[cdPairKey]: {
				groups: {},
				links: {
					video: completeLink({
						sourceScreenKey: "c",
						destinationScreenKey: "d",
						portalHost: "boundary-local",
					}),
				},
			},
		};
		const dismissedSignal = resolveMatchedScreenPortalOwnership({
			boundaryId: "video",
			isSettledHostClosingComplete: true,
			isSettledHostReady: false,
			pairsState,
			portalHost: "boundary-local",
			settledHostScreenKey: "d",
			sourcePairKey: abPairKey,
		});
		const contractedSignal = resolveMatchedScreenPortalOwnership({
			boundaryId: "video",
			isSettledHostReady: true,
			pairsState: {
				[abPairKey]: pairsState[abPairKey]!,
				[bcPairKey]: pairsState[bcPairKey]!,
			},
			portalHost: "boundary-local",
			settledHostScreenKey: "c",
			sourcePairKey: abPairKey,
		});

		expect(dismissedSignal).toEqual({
			hostScreenKey: "c",
			ownerPairKey: cdPairKey,
			ownerScreenKey: "c",
			status: "complete",
		});
		expect(contractedSignal).toEqual({
			hostScreenKey: "c",
			ownerPairKey: bcPairKey,
			ownerScreenKey: "c",
			status: "complete",
		});
	});

	it("keeps the previous complete attachment while the next hop is pending", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const bcPairKey = createScreenPairKey("b", "c");
		const pairsState: LinkPairsState = {
			[abPairKey]: {
				groups: {},
				links: {
					video: completeLink({
						sourceScreenKey: "a",
						destinationScreenKey: "b",
						portalHost: "boundary-local",
					}),
				},
			},
			[bcPairKey]: {
				groups: {},
				links: {
					video: sourceOnlyLink({
						sourceScreenKey: "b",
						portalHost: "boundary-local",
					}),
				},
			},
		};

		const signal = resolveMatchedScreenPortalOwnership({
			boundaryId: "video",
			pairsState,
			portalHost: "boundary-local",
			sourcePairKey: abPairKey,
		});

		expect(signal).toEqual({
			hostScreenKey: null,
			ownerPairKey: abPairKey,
			ownerScreenKey: null,
			status: "pending",
		});
	});
});
