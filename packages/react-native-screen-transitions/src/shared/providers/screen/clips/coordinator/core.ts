import {
	globalSmoothClipLeaseRegistry,
	type SmoothClipLeaseRegistry,
} from "./lease-registry";
import type {
	SmoothClipCompletionBarrierSnapshot,
	SmoothClipCompletionLeg,
	SmoothClipCompletionPlan,
	SmoothClipCompletionToken,
	SmoothClipCoordinatorSnapshot,
	SmoothClipOwnershipInvalidationReason,
	SmoothClipOwnershipState,
	SmoothClipParticipantRegistration,
	SmoothClipTerminalReason,
} from "./types";

type MutableCompletionBarrier = {
	required: Record<SmoothClipCompletionLeg, boolean>;
	completed: Record<SmoothClipCompletionLeg, boolean>;
};

type CoordinatorOptions = Readonly<{
	coordinatorId: string;
	leaseRegistry?: SmoothClipLeaseRegistry;
}>;

type TransitionReplacement = Readonly<{
	routeKey: string;
	completion?: SmoothClipCompletionPlan;
}>;

type NativePromotionResult = Readonly<{
	status: "native" | "streaming" | "fallback" | "unavailable";
	reason:
		| "promoted"
		| "no-participants"
		| "not-ready"
		| "ambiguous-lease"
		| "unsupported-geometry"
		| "invalid-state";
	token: SmoothClipCompletionToken | null;
	snapshot: SmoothClipCoordinatorSnapshot;
}>;

export type NativePromotionPreflight = Readonly<{
	status: "ready" | "streaming" | "fallback" | "unavailable";
	reason: NativePromotionResult["reason"];
	snapshot: SmoothClipCoordinatorSnapshot;
}>;

type CompletionResult = Readonly<{
	accepted: boolean;
	stale: boolean;
	demoted: boolean;
	becameTerminal: boolean;
	snapshot: SmoothClipCoordinatorSnapshot;
}>;

type TerminationResult = Readonly<{
	accepted: boolean;
	groupIdToFinish: number | null;
	snapshot: SmoothClipCoordinatorSnapshot;
}>;

const createCompletionBarrier = (
	plan: SmoothClipCompletionPlan = {},
): MutableCompletionBarrier => ({
	required: {
		reanimated: plan.reanimated === true,
		reset: plan.reset === true,
		native: false,
	},
	completed: {
		reanimated: false,
		reset: false,
		native: false,
	},
});

const copyCompletionBarrier = (
	barrier: MutableCompletionBarrier,
): SmoothClipCompletionBarrierSnapshot => ({
	required: { ...barrier.required },
	completed: { ...barrier.completed },
});

const isPositiveNativeId = (value: number) =>
	Number.isSafeInteger(value) && value > 0;

/**
 * Pure orchestration core for one screen-scoped SmoothClip owner.
 *
 * It deliberately does not call Reanimated or SmoothClip. Callers execute the
 * native/streamed work described by method results and feed completion tokens
 * back into this core.
 */
export class SmoothClipCoordinatorCore {
	private readonly coordinatorId: string;
	private readonly leaseRegistry: SmoothClipLeaseRegistry;
	private readonly participants = new Map<
		string,
		SmoothClipParticipantRegistration
	>();

	private ownerRouteKey: string | null = null;
	private transitionId = 0;
	private ownershipEpoch = 0;
	private groupId: number | null = null;
	private state: SmoothClipOwnershipState = "terminal";
	private fallbackReason: string | null = null;
	private interruptionReason: SmoothClipOwnershipInvalidationReason | null =
		null;
	private terminalReason: SmoothClipTerminalReason | null = "idle";
	private completionBarrier = createCompletionBarrier();

	constructor({
		coordinatorId,
		leaseRegistry = globalSmoothClipLeaseRegistry,
	}: CoordinatorOptions) {
		if (coordinatorId.length === 0) {
			throw new Error("SmoothClip coordinatorId must not be empty");
		}

		this.coordinatorId = coordinatorId;
		this.leaseRegistry = leaseRegistry;
	}

	private readonly handleLeaseConflict = () => {
		this.invalidateOwnership("lease-conflict");
	};

	private createToken(): SmoothClipCompletionToken | null {
		if (!this.ownerRouteKey || this.state === "terminal") {
			return null;
		}

		return {
			ownerRouteKey: this.ownerRouteKey,
			transitionId: this.transitionId,
			ownershipEpoch: this.ownershipEpoch,
			groupId: this.groupId,
		};
	}

	private tokenMatches(token: SmoothClipCompletionToken) {
		return (
			this.state !== "terminal" &&
			this.ownerRouteKey === token.ownerRouteKey &&
			this.transitionId === token.transitionId &&
			this.ownershipEpoch === token.ownershipEpoch &&
			this.groupId === token.groupId
		);
	}

	private isBarrierComplete() {
		let hasRequiredLeg = false;

		for (const leg of ["reanimated", "reset", "native"] as const) {
			if (!this.completionBarrier.required[leg]) {
				continue;
			}

			hasRequiredLeg = true;
			if (!this.completionBarrier.completed[leg]) {
				return false;
			}
		}

		return hasRequiredLeg;
	}

	private transitionToTerminal(reason: SmoothClipTerminalReason) {
		const activeGroupId = this.groupId;
		this.state = "terminal";
		this.groupId = null;
		this.interruptionReason = null;
		this.terminalReason = reason;
		this.leaseRegistry.releaseOwner(this.coordinatorId);
		return activeGroupId;
	}

	private settleCompletionBarrier() {
		if (!this.isBarrierComplete()) {
			return false;
		}

		this.transitionToTerminal("completed");
		return true;
	}

	private markUnsupportedGeometry(reason: string) {
		if (this.fallbackReason !== null) {
			return false;
		}

		this.fallbackReason = reason;
		this.state = this.groupId === null ? "fallback" : "interrupting";
		return true;
	}

	private getNativeIneligibilityReason():
		| NativePromotionResult["reason"]
		| null {
		if (this.participants.size === 0) {
			return "no-participants";
		}

		for (const participant of this.participants.values()) {
			if (!participant.nativeEligible) {
				return "unsupported-geometry";
			}

			if (!participant.ready) {
				return "not-ready";
			}

			if (
				this.leaseRegistry.resolve(
					this.coordinatorId,
					participant.participantId,
				) !== "exclusive"
			) {
				return "ambiguous-lease";
			}
		}

		return null;
	}

	getSnapshot(): SmoothClipCoordinatorSnapshot {
		return {
			ownerRouteKey: this.ownerRouteKey,
			transitionId: this.transitionId,
			ownershipEpoch: this.ownershipEpoch,
			groupId: this.groupId,
			state: this.state,
			fallbackReason: this.fallbackReason,
			interruptionReason: this.interruptionReason,
			terminalReason: this.terminalReason,
			participants: Array.from(this.participants.values()),
			completionBarrier: copyCompletionBarrier(this.completionBarrier),
		};
	}

	getCompletionToken() {
		return this.createToken();
	}

	preflightNativePromotion(): NativePromotionPreflight {
		if (this.state === "fallback") {
			return {
				status: "fallback",
				reason: "unsupported-geometry",
				snapshot: this.getSnapshot(),
			};
		}

		if (this.state !== "tracking") {
			return {
				status: "unavailable",
				reason: "invalid-state",
				snapshot: this.getSnapshot(),
			};
		}

		const ineligibilityReason = this.getNativeIneligibilityReason();
		if (ineligibilityReason === "unsupported-geometry") {
			this.latchUnsupportedGeometry();
			return {
				status: "fallback",
				reason: ineligibilityReason,
				snapshot: this.getSnapshot(),
			};
		}

		if (ineligibilityReason) {
			return {
				status: "streaming",
				reason: ineligibilityReason,
				snapshot: this.getSnapshot(),
			};
		}

		return {
			status: "ready",
			reason: "promoted",
			snapshot: this.getSnapshot(),
		};
	}

	replaceTransition({ routeKey, completion = {} }: TransitionReplacement) {
		if (routeKey.length === 0) {
			throw new Error("SmoothClip routeKey must not be empty");
		}

		const replacedGroupId = this.groupId;
		this.leaseRegistry.releaseOwner(this.coordinatorId);
		this.participants.clear();
		this.ownerRouteKey = routeKey;
		this.transitionId += 1;
		this.ownershipEpoch += 1;
		this.groupId = null;
		this.state = "tracking";
		this.fallbackReason = null;
		this.interruptionReason = null;
		this.terminalReason = null;
		this.completionBarrier = createCompletionBarrier(completion);

		return {
			replacedGroupId,
			token: this.createToken(),
			snapshot: this.getSnapshot(),
		};
	}

	registerParticipant(participant: SmoothClipParticipantRegistration) {
		if (this.state === "terminal") {
			return false;
		}

		if (
			participant.participantId.length === 0 ||
			!isPositiveNativeId(participant.driverId)
		) {
			throw new Error("SmoothClip participant and driver ids must be valid");
		}

		const current = this.participants.get(participant.participantId);
		if (
			current?.driverId === participant.driverId &&
			current.ready === participant.ready &&
			current.nativeEligible === participant.nativeEligible
		) {
			return false;
		}

		if (current) {
			this.leaseRegistry.release(this.coordinatorId, current.participantId);
		}

		this.participants.set(participant.participantId, participant);
		this.invalidateOwnership(
			current && current.ready !== participant.ready
				? "readiness"
				: "participant",
		);
		this.leaseRegistry.claim({
			ownerId: this.coordinatorId,
			participantId: participant.participantId,
			driverId: participant.driverId,
			onConflict: this.handleLeaseConflict,
		});
		if (!participant.nativeEligible) {
			this.markUnsupportedGeometry("unsupported-geometry");
		}
		return true;
	}

	setParticipantReady(participantId: string, ready: boolean) {
		const participant = this.participants.get(participantId);
		if (!participant || participant.ready === ready) {
			return false;
		}

		this.participants.set(participantId, { ...participant, ready });
		this.invalidateOwnership("readiness");
		return true;
	}

	setParticipantNativeEligible(participantId: string, nativeEligible: boolean) {
		const participant = this.participants.get(participantId);
		if (!participant || participant.nativeEligible === nativeEligible) {
			return false;
		}

		this.participants.set(participantId, {
			...participant,
			nativeEligible,
		});
		this.invalidateOwnership("participant");
		if (!nativeEligible) {
			this.markUnsupportedGeometry("unsupported-geometry");
		}
		return true;
	}

	unregisterParticipant(participantId: string) {
		if (!this.participants.delete(participantId)) {
			return false;
		}

		this.leaseRegistry.release(this.coordinatorId, participantId);
		this.invalidateOwnership("participant");
		return true;
	}

	invalidateOwnership(reason: SmoothClipOwnershipInvalidationReason) {
		if (this.state === "terminal") {
			return false;
		}

		this.ownershipEpoch += 1;
		this.interruptionReason = reason;

		if (this.groupId !== null) {
			this.state = "interrupting";
		} else if (this.fallbackReason !== null) {
			this.state = "fallback";
		} else {
			this.state = "tracking";
		}

		return true;
	}

	latchUnsupportedGeometry(reason = "unsupported-geometry") {
		if (this.state === "terminal" || this.fallbackReason !== null) {
			return false;
		}

		this.ownershipEpoch += 1;
		this.interruptionReason = "participant";
		this.markUnsupportedGeometry(reason);
		return true;
	}

	tryBeginNative(groupId: number): NativePromotionResult {
		if (!isPositiveNativeId(groupId)) {
			throw new Error("SmoothClip groupId must be a positive safe integer");
		}

		const preflight = this.preflightNativePromotion();
		if (preflight.status !== "ready") {
			return {
				status: preflight.status,
				reason: preflight.reason,
				token: this.createToken(),
				snapshot: preflight.snapshot,
			};
		}

		this.groupId = groupId;
		this.state = "native";
		this.interruptionReason = null;
		this.completionBarrier.required.native = true;
		this.completionBarrier.completed.native = false;

		return {
			status: "native",
			reason: "promoted",
			token: this.createToken(),
			snapshot: this.getSnapshot(),
		};
	}

	completeLeg(
		leg: Exclude<SmoothClipCompletionLeg, "native">,
		token: SmoothClipCompletionToken,
		finished = true,
	): CompletionResult {
		if (!this.tokenMatches(token)) {
			return {
				accepted: false,
				stale: true,
				demoted: false,
				becameTerminal: false,
				snapshot: this.getSnapshot(),
			};
		}

		if (!this.completionBarrier.required[leg]) {
			return {
				accepted: false,
				stale: false,
				demoted: false,
				becameTerminal: false,
				snapshot: this.getSnapshot(),
			};
		}

		if (finished) {
			this.completionBarrier.completed[leg] = true;
		}

		const becameTerminal = finished && this.settleCompletionBarrier();
		return {
			accepted: true,
			stale: false,
			demoted: false,
			becameTerminal,
			snapshot: this.getSnapshot(),
		};
	}

	completeNative(
		token: SmoothClipCompletionToken,
		finished: boolean,
	): CompletionResult {
		if (!this.tokenMatches(token) || this.state !== "native") {
			return {
				accepted: false,
				stale: true,
				demoted: false,
				becameTerminal: false,
				snapshot: this.getSnapshot(),
			};
		}

		this.completionBarrier.completed.native = true;

		if (!finished) {
			this.completionBarrier.required.native = false;
			this.ownershipEpoch += 1;
			this.groupId = null;
			this.state = this.fallbackReason === null ? "tracking" : "fallback";
		}

		const becameTerminal = this.settleCompletionBarrier();
		return {
			accepted: true,
			stale: false,
			demoted: !finished,
			becameTerminal,
			snapshot: this.getSnapshot(),
		};
	}

	completeInterruption(token: SmoothClipCompletionToken): CompletionResult {
		if (!this.tokenMatches(token) || this.state !== "interrupting") {
			return {
				accepted: false,
				stale: true,
				demoted: false,
				becameTerminal: false,
				snapshot: this.getSnapshot(),
			};
		}

		this.completionBarrier.required.native = false;
		this.completionBarrier.completed.native = true;
		this.groupId = null;
		this.interruptionReason = null;
		this.state = this.fallbackReason === null ? "tracking" : "fallback";
		const becameTerminal = this.settleCompletionBarrier();

		return {
			accepted: true,
			stale: false,
			demoted: true,
			becameTerminal,
			snapshot: this.getSnapshot(),
		};
	}

	finishTransition(token: SmoothClipCompletionToken): TerminationResult {
		if (!this.tokenMatches(token)) {
			return {
				accepted: false,
				groupIdToFinish: null,
				snapshot: this.getSnapshot(),
			};
		}

		const groupIdToFinish = this.transitionToTerminal("finished");
		return {
			accepted: true,
			groupIdToFinish,
			snapshot: this.getSnapshot(),
		};
	}

	detachRoute(routeKey: string): TerminationResult {
		if (this.ownerRouteKey !== routeKey || this.state === "terminal") {
			return {
				accepted: false,
				groupIdToFinish: null,
				snapshot: this.getSnapshot(),
			};
		}

		const groupIdToFinish = this.transitionToTerminal("detached");
		return {
			accepted: true,
			groupIdToFinish,
			snapshot: this.getSnapshot(),
		};
	}
}
