import { describe, expect, it } from "bun:test";
import {
	resolveActiveHandoffReceiver,
	resolveHandoffAttachmentCandidate,
	resolvePreviousHandoffReceiver,
} from "../../components/boundary/portal/components/boundary-content-portal/helpers/active-handoff-receiver";

const scene = (key: string, activity = "active") => ({
	activity,
	route: { key },
});

describe("active handoff receiver", () => {
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
