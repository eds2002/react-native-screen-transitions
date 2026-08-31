export type SmoothClipOwnershipState =
	| "tracking"
	| "native"
	| "interrupting"
	| "fallback"
	| "terminal";

export type SmoothClipCompletionLeg = "reanimated" | "reset" | "native";

export type SmoothClipOwnershipInvalidationReason =
	| "relayout"
	| "portal"
	| "readiness"
	| "participant"
	| "lease-conflict";

export type SmoothClipTerminalReason =
	| "idle"
	| "completed"
	| "detached"
	| "finished";

export type SmoothClipCompletionToken = Readonly<{
	ownerRouteKey: string;
	transitionId: number;
	ownershipEpoch: number;
	groupId: number | null;
}>;

export type SmoothClipParticipantRegistration = Readonly<{
	participantId: string;
	driverId: number;
	ready: boolean;
	nativeEligible: boolean;
}>;

export type SmoothClipCompletionPlan = Readonly<{
	reanimated?: boolean;
	reset?: boolean;
}>;

export type SmoothClipCompletionBarrierSnapshot = Readonly<{
	required: Readonly<Record<SmoothClipCompletionLeg, boolean>>;
	completed: Readonly<Record<SmoothClipCompletionLeg, boolean>>;
}>;

export type SmoothClipCoordinatorSnapshot = Readonly<{
	ownerRouteKey: string | null;
	transitionId: number;
	ownershipEpoch: number;
	groupId: number | null;
	state: SmoothClipOwnershipState;
	fallbackReason: string | null;
	interruptionReason: SmoothClipOwnershipInvalidationReason | null;
	terminalReason: SmoothClipTerminalReason | null;
	participants: readonly SmoothClipParticipantRegistration[];
	completionBarrier: SmoothClipCompletionBarrierSnapshot;
}>;
