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

describe("matched-screen host readiness", () => {
	it("waits for screen portal hosts", () => {
		const link = completeLink({
			sourceScreenKey: "a",
			destinationScreenKey: "b",
			portalHost: "screen",
		});

		expect(usesScreenPortalHost(link)).toBe(true);
	});

	it("does not wait for boundary-local matched-screen portal hosts", () => {
		const link = completeLink({
			sourceScreenKey: "a",
			destinationScreenKey: "b",
			portalHost: "boundary-local",
		});

		expect(usesScreenPortalHost(link)).toBe(false);
	});

	it("ignores boundary-local matched-screen continuations", () => {
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

	it("keeps waiting for screen-level matched-screen continuations", () => {
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

	it("immediately attaches return hops that reverse the previous owner pair", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const baPairKey = createScreenPairKey("b", "a");

		expect(
			canSwitchBoundaryLocalPortalHostImmediately({
				hostScreenKey: "a",
				ownerPairKey: baPairKey,
				previousOwnerPairKey: abPairKey,
			}),
		).toBe(true);
	});

	it("immediately attaches deeper return hops to the previous source host", () => {
		const bcPairKey = createScreenPairKey("b", "c");
		const cbPairKey = createScreenPairKey("c", "b");

		expect(
			canSwitchBoundaryLocalPortalHostImmediately({
				hostScreenKey: "b",
				ownerPairKey: cbPairKey,
				previousOwnerPairKey: bcPairKey,
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

	it("stops a longer chain after rebasing ownership onto the returning pair", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const bcPairKey = createScreenPairKey("b", "c");
		const caPairKey = createScreenPairKey("c", "a");
		const signal = resolveMatchedScreenPortalOwnership({
			boundaryId: "video",
			isSettledHostReady: false,
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
				[caPairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "c",
							destinationScreenKey: "a",
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
			hostScreenKey: "a",
			ownerPairKey: caPairKey,
			ownerScreenKey: "c",
			status: "complete",
		});
	});

	it("uses A as host with B ownership during a B -> A boundary-local return flight", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const baPairKey = createScreenPairKey("b", "a");
		const signal = expectCompleteSignal(resolveMatchedScreenPortalOwnership({
			boundaryId: "video",
			isSettledHostReady: false,
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
				[baPairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "b",
							destinationScreenKey: "a",
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
			hostScreenKey: "a",
			ownerPairKey: baPairKey,
			ownerScreenKey: "b",
			status: "complete",
		});
	});

	it("immediately switches hosts for resolver-produced C -> B return ownership", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const bcPairKey = createScreenPairKey("b", "c");
		const cbPairKey = createScreenPairKey("c", "b");
		const basePairsState: LinkPairsState = {
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

		const previousSignal = expectCompleteSignal(
			resolveMatchedScreenPortalOwnership({
				boundaryId: "video",
				isSettledHostReady: true,
				pairsState: basePairsState,
				portalHost: "boundary-local",
				settledHostScreenKey: "c",
				sourcePairKey: abPairKey,
			}),
		);
		const returnSignal = expectCompleteSignal(
			resolveMatchedScreenPortalOwnership({
				boundaryId: "video",
				isSettledHostReady: false,
				pairsState: {
					...basePairsState,
					[cbPairKey]: {
						groups: {},
						links: {
							video: completeLink({
								sourceScreenKey: "c",
								destinationScreenKey: "b",
								portalHost: "boundary-local",
							}),
						},
					},
				},
				portalHost: "boundary-local",
				settledHostScreenKey: "c",
				sourcePairKey: abPairKey,
			}),
		);

		expect(previousSignal).toMatchObject({
			hostScreenKey: "c",
			ownerPairKey: bcPairKey,
			ownerScreenKey: "c",
		});
		expect(returnSignal).toMatchObject({
			hostScreenKey: "b",
			ownerPairKey: cbPairKey,
			ownerScreenKey: "c",
		});
		expect(
			canSwitchBoundaryLocalPortalHostImmediately({
				hostScreenKey: returnSignal.hostScreenKey,
				ownerPairKey: returnSignal.ownerPairKey,
				previousOwnerPairKey: previousSignal.ownerPairKey,
			}),
		).toBe(true);
	});

	it("rebases boundary-local return ownership to A after B -> A settles", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const baPairKey = createScreenPairKey("b", "a");
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
				[baPairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "b",
							destinationScreenKey: "a",
							portalHost: "boundary-local",
						}),
					},
				},
			},
			portalHost: "boundary-local",
			settledHostScreenKey: "a",
			sourcePairKey: abPairKey,
		});

		expect(signal).toEqual({
			hostScreenKey: "a",
			ownerPairKey: baPairKey,
			ownerScreenKey: "a",
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
