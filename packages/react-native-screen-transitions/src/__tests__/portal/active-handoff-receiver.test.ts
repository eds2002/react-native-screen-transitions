import { describe, expect, it } from "bun:test";
import {
	resolveActiveHandoffReceiver,
	resolveHandoffAttachmentCandidate,
	resolvePreviousHandoffReceiver,
	resolveRequestedHandoffPairKey,
	resolveRequestedHandoffReceiver,
} from "../../components/boundary/portal/components/boundary-content-portal/helpers/active-handoff-receiver";

const scene = (key: string, activity = "active") => ({
	activity,
	route: { key },
});

describe("active handoff receiver", () => {
	it("resolves the matched pair from a destination boundary", () => {
		expect(
			resolveRequestedHandoffPairKey({
				destinationPairHasCompleteLink: true,
				destinationPairKey: "world<>media",
				handoffTarget: "source",
				retainedSourcePairHasCompleteLink: false,
				retainedSourcePairKey: undefined,
				sourcePairHasCompleteLink: false,
				sourcePairKey: undefined,
			}),
		).toBe("world<>media");
	});

	it("keeps a different closing boundary on its retained pair", () => {
		const waterfallPair = resolveRequestedHandoffPairKey({
			destinationPairHasCompleteLink: false,
			destinationPairKey: undefined,
			handoffTarget: "source",
			retainedSourcePairHasCompleteLink: true,
			retainedSourcePairKey: "world<>waterfall-media",
			sourcePairHasCompleteLink: false,
			sourcePairKey: "world<>green-media",
		});
		const greenPair = resolveRequestedHandoffPairKey({
			destinationPairHasCompleteLink: false,
			destinationPairKey: undefined,
			handoffTarget: "destination",
			retainedSourcePairHasCompleteLink: false,
			retainedSourcePairKey: "world<>waterfall-media",
			sourcePairHasCompleteLink: true,
			sourcePairKey: "world<>green-media",
		});

		expect({ greenPair, waterfallPair }).toEqual({
			greenPair: "world<>green-media",
			waterfallPair: "world<>waterfall-media",
		});
	});

	it("uses automatic ownership when no explicit target is requested", () => {
		expect(
			resolveRequestedHandoffReceiver({
				automaticScreenKey: "media",
				destinationScreenKey: "media",
				handoffTarget: "auto",
				sourceScreenKey: "world",
			}),
		).toBe("media");
	});

	it("returns content to the source on the first closing frame", () => {
		expect(
			resolveRequestedHandoffReceiver({
				automaticScreenKey: "media",
				destinationScreenKey: "media",
				handoffTarget: "source",
				sourceScreenKey: "world",
			}),
		).toBe("world");
	});

	it("returns content to the destination when a close is cancelled", () => {
		expect(
			resolveRequestedHandoffReceiver({
				automaticScreenKey: "world",
				destinationScreenKey: "media",
				handoffTarget: "destination",
				sourceScreenKey: "world",
			}),
		).toBe("media");
	});

	it("keeps automatic ownership until a requested destination is ready", () => {
		expect(
			resolveRequestedHandoffReceiver({
				automaticScreenKey: "media-a",
				destinationReady: false,
				destinationScreenKey: "media-b",
				handoffTarget: "destination",
				sourceScreenKey: "world",
			}),
		).toBe("media-a");
		expect(
			resolveRequestedHandoffReceiver({
				automaticScreenKey: "media-a",
				destinationReady: true,
				destinationScreenKey: "media-b",
				handoffTarget: "destination",
				sourceScreenKey: "world",
			}),
		).toBe("media-b");
	});

	it("follows the focused route through A to B to C", () => {
		expect(
			resolveActiveHandoffReceiver({
				focusedIndex: 0,
				routes: [{ key: "a" }],
				scenes: [scene("a")],
			}),
		).toBe("a");
		expect(
			resolveActiveHandoffReceiver({
				focusedIndex: 1,
				routes: [{ key: "a" }, { key: "b" }],
				scenes: [scene("a", "inert"), scene("b")],
			}),
		).toBe("b");
		expect(
			resolveActiveHandoffReceiver({
				focusedIndex: 2,
				routes: [{ key: "a" }, { key: "b" }, { key: "c" }],
				scenes: [scene("a", "inactive"), scene("b", "inert"), scene("c")],
			}),
		).toBe("c");
	});

	it("keeps C active while it closes, then returns to B", () => {
		expect(
			resolveActiveHandoffReceiver({
				focusedIndex: 1,
				routes: [{ key: "a" }, { key: "b" }],
				scenes: [scene("a", "inactive"), scene("b"), scene("c", "closing")],
			}),
		).toBe("c");
		expect(
			resolveActiveHandoffReceiver({
				focusedIndex: 1,
				routes: [{ key: "a" }, { key: "b" }],
				scenes: [scene("a", "inert"), scene("b")],
			}),
		).toBe("b");
	});

	it("returns to B while the closing C route is still focused", () => {
		const stack = {
			focusedIndex: 2,
			routes: [{ key: "a" }, { key: "b" }, { key: "c" }],
			scenes: [
				scene("a", "inactive"),
				scene("b", "inactive"),
				scene("c", "closing"),
			],
		};

		expect(resolveActiveHandoffReceiver(stack)).toBe("c");
		expect(resolvePreviousHandoffReceiver(stack)).toBe("b");
	});

	it("returns to B when the closing C route has left the route state", () => {
		expect(
			resolvePreviousHandoffReceiver({
				focusedIndex: 1,
				routes: [{ key: "a" }, { key: "b" }],
				scenes: [scene("a", "inactive"), scene("b"), scene("c", "closing")],
			}),
		).toBe("b");
	});

	it("selects a ready queued receiver before the active route catches up", () => {
		expect(
			resolveHandoffAttachmentCandidate({
				activeReceiverClosing: true,
				activeReceiverScreenKey: "player-a",
				attachedReceiverScreenKey: "index",
				hasActiveCloseFinished: false,
				interpolatorReady: true,
				pairDestinationScreenKey: "player-b",
				previousReceiverScreenKey: "index",
			}),
		).toBe("player-b");
	});

	it("keeps a queued receiver detached until its interpolator is ready", () => {
		expect(
			resolveHandoffAttachmentCandidate({
				activeReceiverClosing: true,
				activeReceiverScreenKey: "player-a",
				attachedReceiverScreenKey: "index",
				hasActiveCloseFinished: false,
				interpolatorReady: false,
				pairDestinationScreenKey: "player-b",
				previousReceiverScreenKey: "index",
			}),
		).toBe("player-a");
	});

	it("moves directly to a newly queued receiver while the current receiver closes", () => {
		const params = {
			activeReceiverClosing: true,
			activeReceiverScreenKey: "player-a",
			hasActiveCloseFinished: false,
			interpolatorReady: true,
			pairChangedDuringClose: true,
			pairDestinationScreenKey: "player-b",
			previousReceiverScreenKey: "index",
		};

		const firstCandidate = resolveHandoffAttachmentCandidate({
			...params,
			attachedReceiverScreenKey: "player-a",
		});

		expect(firstCandidate).toBe("player-b");
		expect(
			resolveHandoffAttachmentCandidate({
				...params,
				attachedReceiverScreenKey: firstCandidate,
			}),
		).toBe("player-b");
	});

	it("keeps a closing payload absent from the fresh pair until close finishes", () => {
		const params = {
			activeReceiverClosing: true,
			activeReceiverScreenKey: "waterfall-media",
			attachedReceiverScreenKey: "waterfall-media",
			interpolatorReady: false,
			pairChangedDuringClose: true,
			pairDestinationScreenKey: null,
			pairHasBoundaryLink: false,
			previousReceiverScreenKey: "world",
		};

		expect(
			resolveHandoffAttachmentCandidate({
				...params,
				hasActiveCloseFinished: false,
			}),
		).toBe("waterfall-media");
		expect(
			resolveHandoffAttachmentCandidate({
				...params,
				hasActiveCloseFinished: true,
			}),
		).toBe("world");
	});

	it("keeps a same-id closing payload while its fresh pair is incomplete", () => {
		expect(
			resolveHandoffAttachmentCandidate({
				activeReceiverClosing: true,
				activeReceiverScreenKey: "media-a",
				attachedReceiverScreenKey: "media-a",
				hasActiveCloseFinished: false,
				interpolatorReady: false,
				pairChangedDuringClose: true,
				pairDestinationScreenKey: null,
				pairHasBoundaryLink: true,
				previousReceiverScreenKey: "world",
			}),
		).toBe("media-a");
	});

	it("does not give a fresh payload to an unlinked closing receiver", () => {
		expect(
			resolveHandoffAttachmentCandidate({
				activeReceiverClosing: true,
				activeReceiverScreenKey: "media-a",
				attachedReceiverScreenKey: "media-b",
				hasActiveCloseFinished: false,
				interpolatorReady: false,
				pairDestinationScreenKey: null,
				pairHasBoundaryLink: false,
				previousReceiverScreenKey: "world",
			}),
		).toBe("media-b");
	});

	it("ignores a stale shallow pair while a deeper receiver closes", () => {
		expect(
			resolveHandoffAttachmentCandidate({
				activeReceiverClosing: true,
				activeReceiverScreenKey: "player-d",
				attachedReceiverScreenKey: "player-d",
				hasActiveCloseFinished: false,
				interpolatorReady: true,
				pairChangedDuringClose: false,
				pairDestinationScreenKey: "player-b",
				previousReceiverScreenKey: "player-c",
			}),
		).toBe("player-d");
	});

	it("follows C when the retained pair only confirms the current B receiver", () => {
		expect(
			resolveHandoffAttachmentCandidate({
				activeReceiverClosing: false,
				activeReceiverScreenKey: "player-c",
				attachedReceiverScreenKey: "player-b",
				hasActiveCloseFinished: false,
				interpolatorReady: true,
				pairDestinationScreenKey: "player-b",
				previousReceiverScreenKey: "player-a",
			}),
		).toBe("player-c");
	});

	it("does not pull a queued payload back when another receiver finishes closing", () => {
		expect(
			resolveHandoffAttachmentCandidate({
				activeReceiverClosing: true,
				activeReceiverScreenKey: "player-a",
				attachedReceiverScreenKey: "player-b",
				hasActiveCloseFinished: true,
				interpolatorReady: true,
				pairChangedDuringClose: true,
				pairDestinationScreenKey: "player-b",
				previousReceiverScreenKey: "index",
			}),
		).toBe("player-b");
	});

	it("returns a payload that is attached to the receiver finishing its close", () => {
		const params = {
			activeReceiverClosing: true,
			activeReceiverScreenKey: "player-e",
			hasActiveCloseFinished: true,
			interpolatorReady: true,
			pairChangedDuringClose: false,
			pairDestinationScreenKey: "player-b",
			previousReceiverScreenKey: "player-d",
		};

		const returnedReceiver = resolveHandoffAttachmentCandidate({
			...params,
			attachedReceiverScreenKey: "player-e",
		});

		expect(returnedReceiver).toBe("player-d");
		expect(
			resolveHandoffAttachmentCandidate({
				...params,
				attachedReceiverScreenKey: returnedReceiver,
			}),
		).toBe("player-d");
	});

	it("ignores the stale A to B pair after the payload reaches C", () => {
		expect(
			resolveHandoffAttachmentCandidate({
				activeReceiverClosing: false,
				activeReceiverScreenKey: "player-c",
				attachedReceiverScreenKey: "player-c",
				hasActiveCloseFinished: false,
				interpolatorReady: true,
				pairDestinationScreenKey: "player-b",
				previousReceiverScreenKey: "player-b",
			}),
		).toBe("player-c");
	});

	it("keeps the payload on C throughout its close despite the stale A to B pair", () => {
		expect(
			resolveHandoffAttachmentCandidate({
				activeReceiverClosing: true,
				activeReceiverScreenKey: "player-c",
				attachedReceiverScreenKey: "player-c",
				hasActiveCloseFinished: false,
				interpolatorReady: true,
				pairDestinationScreenKey: "player-b",
				previousReceiverScreenKey: "player-b",
			}),
		).toBe("player-c");
	});

	it("selects a queued receiver that becomes ready at another receiver's close endpoint", () => {
		expect(
			resolveHandoffAttachmentCandidate({
				activeReceiverClosing: true,
				activeReceiverScreenKey: "player-a",
				attachedReceiverScreenKey: "index",
				hasActiveCloseFinished: true,
				interpolatorReady: true,
				pairChangedDuringClose: true,
				pairDestinationScreenKey: "player-b",
				previousReceiverScreenKey: "index",
			}),
		).toBe("player-b");
	});
});
