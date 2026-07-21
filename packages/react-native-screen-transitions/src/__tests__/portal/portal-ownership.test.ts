import { describe, expect, it } from "bun:test";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import type { LinkPairsState, TagLink } from "../../stores/bounds/types";
import {
	canSwitchHandoffHostImmediately,
	isHandoffHostClosingComplete,
	resolveBoundaryPortalOwnership,
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
	escapeClipping,
	handoff,
	sourceScreenKey,
}: {
	destinationScreenKey: string;
	escapeClipping?: boolean;
	handoff?: boolean;
	sourceScreenKey: string;
}): TagLink => ({
	status: "complete",
	source: {
		screenKey: sourceScreenKey,
		bounds: createBounds(),
		styles: {},
		handoff,
		escapeClipping,
	},
	destination: {
		screenKey: destinationScreenKey,
		bounds: createBounds(100, 100),
		styles: {},
	},
});

const sourceOnlyLink = ({
	escapeClipping,
	handoff,
	sourceScreenKey,
}: {
	escapeClipping?: boolean;
	handoff?: boolean;
	sourceScreenKey: string;
}): TagLink => ({
	status: "destination-incomplete",
	source: {
		screenKey: sourceScreenKey,
		bounds: createBounds(),
		styles: {},
		handoff,
		escapeClipping,
	},
	destination: null,
});

describe("isHandoffHostClosingComplete", () => {
	it("does not treat a pending close as completed", () => {
		expect(
			isHandoffHostClosingComplete({
				closing: 1,
				progressAnimating: 0,
				progressSettled: 1,
				willAnimate: 1,
			}),
		).toBe(false);
	});

	it("waits for a settled spring to finish animating", () => {
		expect(
			isHandoffHostClosingComplete({
				closing: 1,
				progressAnimating: 1,
				progressSettled: 1,
				willAnimate: 0,
			}),
		).toBe(false);

		expect(
			isHandoffHostClosingComplete({
				closing: 1,
				progressAnimating: 0,
				progressSettled: 1,
				willAnimate: 0,
			}),
		).toBe(true);
	});
});

describe("canSwitchHandoffHostImmediately", () => {
	it("immediately attaches retreated same-pair source hosts", () => {
		const abPairKey = createScreenPairKey("a", "b");

		expect(
			canSwitchHandoffHostImmediately({
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
			canSwitchHandoffHostImmediately({
				hostScreenKey: "b",
				ownerPairKey: abPairKey,
				previousOwnerPairKey: bcPairKey,
			}),
		).toBe(true);
	});
});

describe("resolveBoundaryPortalOwnership", () => {
	it("keeps escape-only portals on the current screen", () => {
		const pairKey = createScreenPairKey("a", "b");
		const signal = resolveBoundaryPortalOwnership({
			boundaryId: "video",
			currentScreenKey: "a",
			handoff: false,
			pairsState: {
				[pairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "a",
							destinationScreenKey: "b",
							escapeClipping: true,
						}),
					},
				},
			},
			sourcePairKey: pairKey,
		});

		expect(signal).toEqual({
			hostScreenKey: "a",
			ownerPairKey: pairKey,
			ownerScreenKey: "a",
			status: "complete",
		});
	});

	it("keeps A as owner during A -> B handoff", () => {
		const pairKey = createScreenPairKey("a", "b");
		const signal = resolveBoundaryPortalOwnership({
			boundaryId: "video",
			currentScreenKey: "a",
			handoff: true,
			isSettledHostReady: false,
			pairsState: {
				[pairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "a",
							destinationScreenKey: "b",
							handoff: true,
						}),
					},
				},
			},
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

	it("returns a settled closing A -> B handoff to A", () => {
		const pairKey = createScreenPairKey("a", "b");
		const signal = resolveBoundaryPortalOwnership({
			boundaryId: "video",
			currentScreenKey: "a",
			handoff: true,
			isSettledHostClosingComplete: true,
			isSettledHostReady: false,
			pairsState: {
				[pairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "a",
							destinationScreenKey: "b",
							handoff: true,
						}),
					},
				},
			},
			settledHostScreenKey: "b",
			sourcePairKey: pairKey,
		});

		expect(signal).toEqual({
			hostScreenKey: "a",
			ownerPairKey: pairKey,
			ownerScreenKey: "a",
			status: "complete",
		});
	});

	it("rebases handoff ownership after settle", () => {
		const pairKey = createScreenPairKey("a", "b");
		const signal = resolveBoundaryPortalOwnership({
			boundaryId: "video",
			currentScreenKey: "a",
			handoff: true,
			isSettledHostReady: true,
			pairsState: {
				[pairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "a",
							destinationScreenKey: "b",
							handoff: true,
						}),
					},
				},
			},
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

	it("keeps handoff ownership independent from escapeClipping after settle", () => {
		const pairKey = createScreenPairKey("a", "b");
		const signal = resolveBoundaryPortalOwnership({
			boundaryId: "video",
			currentScreenKey: "a",
			handoff: true,
			isSettledHostReady: true,
			pairsState: {
				[pairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "a",
							destinationScreenKey: "b",
							handoff: true,
							escapeClipping: true,
						}),
					},
				},
			},
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

	it("uses B as owner during B -> C in an active handoff chain", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const bcPairKey = createScreenPairKey("b", "c");
		const signal = resolveBoundaryPortalOwnership({
			boundaryId: "video",
			currentScreenKey: "a",
			handoff: true,
			isSettledHostReady: true,
			pairsState: {
				[abPairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "a",
							destinationScreenKey: "b",
							handoff: true,
						}),
					},
				},
				[bcPairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "b",
							destinationScreenKey: "c",
							handoff: true,
						}),
					},
				},
			},
			settledHostScreenKey: "b",
			sourcePairKey: abPairKey,
		});

		expect(signal).toEqual({
			hostScreenKey: "c",
			ownerPairKey: bcPairKey,
			ownerScreenKey: "b",
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
						handoff: true,
					}),
				},
			},
			[bcPairKey]: {
				groups: {},
				links: {
					video: completeLink({
						sourceScreenKey: "b",
						destinationScreenKey: "c",
						handoff: true,
					}),
				},
			},
		};

		const signal = resolveBoundaryPortalOwnership({
			boundaryId: "video",
			currentScreenKey: "a",
			handoff: true,
			isSettledHostClosingComplete: true,
			isSettledHostReady: false,
			pairsState,
			settledHostScreenKey: "c",
			sourcePairKey: abPairKey,
		});

		expect(signal).toEqual({
			hostScreenKey: "b",
			ownerPairKey: bcPairKey,
			ownerScreenKey: "b",
			status: "complete",
		});
	});

	it("waits while the next handoff hop is pending", () => {
		const abPairKey = createScreenPairKey("a", "b");
		const bcPairKey = createScreenPairKey("b", "c");
		const signal = resolveBoundaryPortalOwnership({
			boundaryId: "video",
			currentScreenKey: "a",
			handoff: true,
			pairsState: {
				[abPairKey]: {
					groups: {},
					links: {
						video: completeLink({
							sourceScreenKey: "a",
							destinationScreenKey: "b",
							handoff: true,
						}),
					},
				},
				[bcPairKey]: {
					groups: {},
					links: {
						video: sourceOnlyLink({
							sourceScreenKey: "b",
							handoff: true,
						}),
					},
				},
			},
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
