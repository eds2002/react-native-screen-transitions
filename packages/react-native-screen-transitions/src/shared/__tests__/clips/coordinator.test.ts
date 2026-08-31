import { describe, expect, it } from "bun:test";
import {
	SmoothClipCoordinatorCore,
	SmoothClipLeaseRegistry,
} from "../../providers/screen/clips/coordinator";
import type {
	SmoothClipCompletionLeg,
	SmoothClipCompletionToken,
} from "../../providers/screen/clips/coordinator/types";

const createCoordinator = (
	coordinatorId: string,
	leaseRegistry = new SmoothClipLeaseRegistry(),
) => new SmoothClipCoordinatorCore({ coordinatorId, leaseRegistry });

const registerReadyParticipant = (
	coordinator: SmoothClipCoordinatorCore,
	participantId = "card",
	driverId = 1,
) =>
	coordinator.registerParticipant({
		participantId,
		driverId,
		ready: true,
		nativeEligible: true,
	});

const requireToken = (
	token: SmoothClipCompletionToken | null,
): SmoothClipCompletionToken => {
	if (!token) {
		throw new Error("Expected an active coordinator token");
	}

	return token;
};

describe("SmoothClipCoordinatorCore", () => {
	it("owns and completes an A to B transition across all barrier legs", () => {
		const coordinator = createCoordinator("screen-B");
		const started = coordinator.replaceTransition({
			routeKey: "B",
			completion: { reanimated: true, reset: true },
		});

		expect(started.snapshot).toMatchObject({
			ownerRouteKey: "B",
			transitionId: 1,
			ownershipEpoch: 1,
			state: "tracking",
		});

		registerReadyParticipant(coordinator);
		const promotion = coordinator.tryBeginNative(101);
		const token = requireToken(promotion.token);

		expect(promotion.status).toBe("native");
		expect(token).toEqual({
			ownerRouteKey: "B",
			transitionId: 1,
			ownershipEpoch: 2,
			groupId: 101,
		});

		expect(coordinator.completeLeg("reanimated", token).becameTerminal).toBe(
			false,
		);
		expect(coordinator.completeLeg("reset", token).becameTerminal).toBe(false);
		const completed = coordinator.completeNative(token, true);

		expect(completed.becameTerminal).toBe(true);
		expect(completed.snapshot).toMatchObject({
			state: "terminal",
			terminalReason: "completed",
			groupId: null,
		});
	});

	it("replaces A to B with B to C and rejects the displaced transition", () => {
		const coordinator = createCoordinator("screen-owner");
		coordinator.replaceTransition({
			routeKey: "B",
			completion: { reanimated: true },
		});
		registerReadyParticipant(coordinator);
		const bToken = requireToken(coordinator.tryBeginNative(201).token);
		const beforeReplacement = coordinator.getSnapshot();

		const replacement = coordinator.replaceTransition({
			routeKey: "C",
			completion: { reanimated: true },
		});

		expect(replacement.replacedGroupId).toBe(201);
		expect(replacement.snapshot).toMatchObject({
			ownerRouteKey: "C",
			transitionId: beforeReplacement.transitionId + 1,
			ownershipEpoch: beforeReplacement.ownershipEpoch + 1,
			state: "tracking",
			groupId: null,
		});
		expect(coordinator.completeNative(bToken, false)).toMatchObject({
			accepted: false,
			stale: true,
			demoted: false,
		});
		expect(coordinator.detachRoute("B").accepted).toBe(false);
		expect(coordinator.getSnapshot().ownerRouteKey).toBe("C");
	});

	it("validates route, transition, epoch, and group on native completions", () => {
		const coordinator = createCoordinator("stale-checks");
		coordinator.replaceTransition({ routeKey: "B" });
		registerReadyParticipant(coordinator);
		const token = requireToken(coordinator.tryBeginNative(301).token);
		const staleTokens: SmoothClipCompletionToken[] = [
			{ ...token, ownerRouteKey: "C" },
			{ ...token, transitionId: token.transitionId + 1 },
			{ ...token, ownershipEpoch: token.ownershipEpoch + 1 },
			{ ...token, groupId: 302 },
		];

		for (const staleToken of staleTokens) {
			expect(coordinator.completeNative(staleToken, false)).toMatchObject({
				accepted: false,
				stale: true,
				demoted: false,
			});
			expect(coordinator.getSnapshot()).toMatchObject({
				state: "native",
				groupId: 301,
			});
		}
	});

	it("invalidates only the epoch for relayout and resumes after interruption", () => {
		const coordinator = createCoordinator("relayout");
		coordinator.replaceTransition({ routeKey: "B" });
		registerReadyParticipant(coordinator);
		const oldToken = requireToken(coordinator.tryBeginNative(401).token);
		const beforeRelayout = coordinator.getSnapshot();

		expect(coordinator.invalidateOwnership("relayout")).toBe(true);
		const interrupted = coordinator.getSnapshot();
		expect(interrupted).toMatchObject({
			transitionId: beforeRelayout.transitionId,
			ownershipEpoch: beforeRelayout.ownershipEpoch + 1,
			groupId: 401,
			state: "interrupting",
			interruptionReason: "relayout",
		});
		expect(coordinator.completeNative(oldToken, true).stale).toBe(true);

		const interruptionToken = requireToken(coordinator.getCompletionToken());
		const resumed = coordinator.completeInterruption(interruptionToken);
		expect(resumed).toMatchObject({ accepted: true, demoted: true });
		expect(resumed.snapshot).toMatchObject({
			state: "tracking",
			groupId: null,
			transitionId: beforeRelayout.transitionId,
		});
		expect(coordinator.tryBeginNative(402).status).toBe("native");
	});

	it("increments only the epoch for portal, readiness, and participant changes", () => {
		const coordinator = createCoordinator("invalidations");
		coordinator.replaceTransition({ routeKey: "B" });
		const transitionId = coordinator.getSnapshot().transitionId;
		let epoch = coordinator.getSnapshot().ownershipEpoch;

		registerReadyParticipant(coordinator);
		expect(coordinator.getSnapshot()).toMatchObject({
			transitionId,
			ownershipEpoch: epoch + 1,
		});
		epoch += 1;

		coordinator.setParticipantReady("card", false);
		expect(coordinator.getSnapshot()).toMatchObject({
			transitionId,
			ownershipEpoch: epoch + 1,
		});
		epoch += 1;

		coordinator.invalidateOwnership("portal");
		expect(coordinator.getSnapshot()).toMatchObject({
			transitionId,
			ownershipEpoch: epoch + 1,
		});
		epoch += 1;

		coordinator.unregisterParticipant("card");
		expect(coordinator.getSnapshot()).toMatchObject({
			transitionId,
			ownershipEpoch: epoch + 1,
		});
	});

	it("forces streaming for ambiguous driver leases and interrupts a native owner", () => {
		const leases = new SmoothClipLeaseRegistry();
		const first = createCoordinator("first", leases);
		const second = createCoordinator("second", leases);
		first.replaceTransition({ routeKey: "B" });
		second.replaceTransition({ routeKey: "D" });
		registerReadyParticipant(first, "first-card", 9);
		const firstToken = requireToken(first.tryBeginNative(501).token);

		registerReadyParticipant(second, "second-card", 9);

		expect(first.getSnapshot()).toMatchObject({
			state: "interrupting",
			groupId: 501,
			interruptionReason: "lease-conflict",
		});
		expect(first.completeNative(firstToken, false).stale).toBe(true);
		expect(second.tryBeginNative(502)).toMatchObject({
			status: "streaming",
			reason: "ambiguous-lease",
		});

		first.completeInterruption(requireToken(first.getCompletionToken()));
		second.detachRoute("D");
		expect(first.tryBeginNative(503).status).toBe("native");
	});

	it("treats participant identity overlap as ambiguous even with different drivers", () => {
		const leases = new SmoothClipLeaseRegistry();
		const first = createCoordinator("first-participant", leases);
		const second = createCoordinator("second-participant", leases);
		first.replaceTransition({ routeKey: "B" });
		second.replaceTransition({ routeKey: "D" });
		registerReadyParticipant(first, "shared-card", 10);
		registerReadyParticipant(second, "shared-card", 11);

		expect(first.tryBeginNative(601).reason).toBe("ambiguous-lease");
		expect(second.tryBeginNative(602).reason).toBe("ambiguous-lease");
	});

	it("keeps the native participant set immutable by interrupting on changes", () => {
		const coordinator = createCoordinator("immutable-participants");
		coordinator.replaceTransition({ routeKey: "B" });
		registerReadyParticipant(coordinator, "card", 12);
		coordinator.tryBeginNative(701);
		const beforeChange = coordinator.getSnapshot();

		registerReadyParticipant(coordinator, "badge", 13);

		expect(coordinator.getSnapshot()).toMatchObject({
			state: "interrupting",
			transitionId: beforeChange.transitionId,
			ownershipEpoch: beforeChange.ownershipEpoch + 1,
			groupId: 701,
		});
	});

	it("completes the barrier in every leg order", () => {
		const orders: SmoothClipCompletionLeg[][] = [
			["reanimated", "reset", "native"],
			["native", "reanimated", "reset"],
			["reset", "native", "reanimated"],
		];

		for (const [index, order] of orders.entries()) {
			const coordinator = createCoordinator(`barrier-${index}`);
			coordinator.replaceTransition({
				routeKey: `route-${index}`,
				completion: { reanimated: true, reset: true },
			});
			registerReadyParticipant(coordinator, "card", 20 + index);
			const token = requireToken(
				coordinator.tryBeginNative(800 + index).token,
			);

			for (let legIndex = 0; legIndex < order.length; legIndex += 1) {
				const leg = order[legIndex];
				const result =
					leg === "native"
						? coordinator.completeNative(token, true)
						: coordinator.completeLeg(leg, token);

				expect(result.becameTerminal).toBe(legIndex === order.length - 1);
			}

			expect(coordinator.getSnapshot()).toMatchObject({
				state: "terminal",
				terminalReason: "completed",
			});
		}
	});

	it("demotes only a current finished-false native result", () => {
		const coordinator = createCoordinator("demotion");
		coordinator.replaceTransition({
			routeKey: "B",
			completion: { reanimated: true, reset: true },
		});
		registerReadyParticipant(coordinator);
		const nativeToken = requireToken(coordinator.tryBeginNative(901).token);
		coordinator.completeLeg("reanimated", nativeToken);

		const stale = coordinator.completeNative(
			{ ...nativeToken, groupId: 902 },
			false,
		);
		expect(stale).toMatchObject({
			accepted: false,
			stale: true,
			demoted: false,
		});
		expect(coordinator.getSnapshot().state).toBe("native");

		const demoted = coordinator.completeNative(nativeToken, false);
		expect(demoted).toMatchObject({
			accepted: true,
			stale: false,
			demoted: true,
			becameTerminal: false,
		});
		expect(demoted.snapshot).toMatchObject({
			state: "tracking",
			groupId: null,
			ownershipEpoch: nativeToken.ownershipEpoch + 1,
		});
		expect(demoted.snapshot.completionBarrier.completed.native).toBe(true);

		const currentToken = requireToken(coordinator.getCompletionToken());
		expect(coordinator.completeLeg("reset", currentToken).becameTerminal).toBe(
			true,
		);
	});

	it("latches unsupported geometry until the next transition", () => {
		const coordinator = createCoordinator("fallback");
		coordinator.replaceTransition({ routeKey: "B" });
		coordinator.registerParticipant({
			participantId: "card",
			driverId: 30,
			ready: true,
			nativeEligible: false,
		});

		expect(coordinator.tryBeginNative(1001)).toMatchObject({
			status: "fallback",
			reason: "unsupported-geometry",
		});
		const fallbackTransitionId = coordinator.getSnapshot().transitionId;
		coordinator.setParticipantNativeEligible("card", true);
		coordinator.invalidateOwnership("relayout");

		expect(coordinator.getSnapshot()).toMatchObject({
			state: "fallback",
			fallbackReason: "unsupported-geometry",
			transitionId: fallbackTransitionId,
		});
		expect(coordinator.tryBeginNative(1002).status).toBe("fallback");

		coordinator.replaceTransition({ routeKey: "C" });
		registerReadyParticipant(coordinator, "card", 30);
		expect(coordinator.getSnapshot().fallbackReason).toBeNull();
		expect(coordinator.tryBeginNative(1003).status).toBe("native");

		coordinator.setParticipantNativeEligible("card", false);
		expect(coordinator.getSnapshot()).toMatchObject({
			state: "interrupting",
			fallbackReason: "unsupported-geometry",
		});
		const interrupted = coordinator.completeInterruption(
			requireToken(coordinator.getCompletionToken()),
		);
		expect(interrupted.snapshot.state).toBe("fallback");
	});

	it("makes route detach and explicit finish terminal and releases leases", () => {
		const leases = new SmoothClipLeaseRegistry();
		const detached = createCoordinator("detach", leases);
		detached.replaceTransition({ routeKey: "B" });
		registerReadyParticipant(detached, "card", 40);
		const detachedToken = requireToken(detached.tryBeginNative(1101).token);

		expect(detached.detachRoute("A").accepted).toBe(false);
		const detachResult = detached.detachRoute("B");
		expect(detachResult).toMatchObject({
			accepted: true,
			groupIdToFinish: 1101,
		});
		expect(detachResult.snapshot).toMatchObject({
			state: "terminal",
			terminalReason: "detached",
		});
		expect(detached.completeNative(detachedToken, true).stale).toBe(true);

		const replacement = createCoordinator("after-detach", leases);
		replacement.replaceTransition({ routeKey: "C" });
		registerReadyParticipant(replacement, "card", 40);
		expect(replacement.tryBeginNative(1102).status).toBe("native");

		const finished = createCoordinator("finish", leases);
		finished.replaceTransition({ routeKey: "D" });
		registerReadyParticipant(finished, "other-card", 41);
		const finishToken = requireToken(finished.tryBeginNative(1103).token);
		const finishResult = finished.finishTransition(finishToken);
		expect(finishResult).toMatchObject({
			accepted: true,
			groupIdToFinish: 1103,
		});
		expect(finishResult.snapshot).toMatchObject({
			state: "terminal",
			terminalReason: "finished",
		});
	});
});
