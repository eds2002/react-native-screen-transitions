import type { SharedValue } from "react-native-reanimated";
import {
	canonicalizeClipPresentation,
	getSmoothClipCapabilities,
	type SmoothClipCapabilities,
	type SmoothClipDriver,
	type SmoothClipGroupAnimationResult,
	type SmoothClipGroupDriver,
	type SmoothClipGroupKeyframeAnimation,
	type SmoothClipGroupKeyframeEntry,
	type SmoothClipGroupMotionAnimation,
	type SmoothClipGroupMotionEntry,
	type SmoothClipGroupSnapshot,
	type SmoothClipPresentation,
} from "react-native-smooth-clip-view";
import type { BuiltInClipNativePlanMetadata } from "../../../../utils/bounds/navigation/clip/native-plan";
import { REVEAL_CLIP_NATIVE_PLAN } from "../../../../utils/bounds/navigation/reveal/native-plan";
import { ZOOM_CLIP_NATIVE_PLAN } from "../../../../utils/bounds/navigation/zoom/native-plan";
import type { ClipStreamCanonicalSnapshot } from "../../clip/clip-stream-ui";
import { SmoothClipCoordinatorCore } from "./core";
import {
	globalSmoothClipLeaseRegistry,
	type SmoothClipLeaseRegistry,
} from "./lease-registry";
import type {
	SmoothClipCompletionToken,
	SmoothClipCoordinatorSnapshot,
	SmoothClipOwnershipInvalidationReason,
} from "./types";

/** Physical promotion remains opt-in until built-in hosts supply all gates. */
export const INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION = false;

export type SmoothClipNativePlanBlocker =
	| "rotation"
	| "nonuniform-scale"
	| "matrix";

export type TrustedSmoothClipNativePlan = BuiltInClipNativePlanMetadata;

export type SmoothClipPhysicalRootKind = "screen" | "float-overlay";

export type SmoothClipRuntimeParticipantRegistration = Readonly<{
	driver: SmoothClipDriver;
	registrationId: number;
	rootId: number;
	slotId: string;
	streamingSuspended: SharedValue<number>;
	trustedPlans?: readonly TrustedSmoothClipNativePlan[];
}>;

type RuntimeRoot = {
	driver: SmoothClipGroupDriver;
	kind: SmoothClipPhysicalRootKind;
	rootId: number;
	routeKey: string;
};

type RuntimeParticipant = SmoothClipRuntimeParticipantRegistration & {
	driverId: number;
	participantId: string;
};

type CompletionRecord = {
	completionId: number;
	onTeardown?: (finished: boolean) => void;
	routeKey: string;
	teardownScheduled: boolean;
	transitionId: number;
};

type NativeGroupRecord = {
	driver: SmoothClipGroupDriver;
	drivers: readonly SmoothClipDriver[];
	groupId: number;
	rootId: number;
	routeKey: string;
	token: SmoothClipCompletionToken;
};

type RuntimeOwner = {
	completion: CompletionRecord | null;
	coordinator: SmoothClipCoordinatorCore;
	gestureFrom: Map<number, SmoothClipPresentation>;
	registeredParticipantIds: Set<string>;
	routeKey: string;
	selectedPlan: TrustedSmoothClipNativePlan | null;
	suspendedStreams: Set<SharedValue<number>>;
};

type RuntimeStoreOptions = Readonly<{
	capabilities?: () => SmoothClipCapabilities;
	leaseRegistry?: SmoothClipLeaseRegistry;
	promotionEnabled?: boolean;
	scheduleFrame?: (callback: () => void) => void;
	storeId?: string;
	trustedPlans?: readonly TrustedSmoothClipNativePlan[];
}>;

type BeginCompletionOptions = Readonly<{
	completionId: number;
	onTeardown?: (finished: boolean) => void;
	requiresReset: boolean;
	routeKey: string;
}>;

export type SmoothClipNativeTarget = Readonly<{
	activeBlockers?: readonly SmoothClipNativePlanBlocker[];
	frames?: readonly Readonly<{
		offset: number;
		presentation: SmoothClipPresentation;
	}>[];
	slotId: string;
	target: SmoothClipPresentation;
}>;

type NativePromotionRequest = Readonly<{
	animation: SmoothClipGroupMotionAnimation | SmoothClipGroupKeyframeAnimation;
	hostReady: boolean;
	plan: TrustedSmoothClipNativePlan;
	routeKey: string;
	source: "transition" | "gesture-release";
	stableParticipants: boolean;
	targets: readonly SmoothClipNativeTarget[];
}>;

type NativeRetargetRequest = Omit<
	NativePromotionRequest,
	"source" | "stableParticipants"
> &
	Readonly<{ source?: never }>;

export type SmoothClipNativePromotionResult = Readonly<{
	groupId: number | null;
	reason:
		| "promoted"
		| "disabled"
		| "untrusted-plan"
		| "capabilities"
		| "host-not-ready"
		| "unstable-participants"
		| "participant-mismatch"
		| "geometric-blocker"
		| "not-ready"
		| "no-root"
		| "stale"
		| "invalid-state"
		| "ambiguous-lease"
		| "unsupported-geometry";
	status: "native" | "streaming" | "fallback" | "unavailable";
}>;

export type SmoothClipRecordedNativeFrame = Readonly<{
	hostReady: boolean;
	participantFingerprint: string;
	planId: TrustedSmoothClipNativePlan["id"];
	progress: number;
	targets: readonly SmoothClipNativeTarget[];
}>;

type RecordedRootFrame = Readonly<{
	frame: SmoothClipRecordedNativeFrame;
	rootId: number;
	routeKey: string;
}>;

type RecordedRoutePlan = {
	active: boolean;
	currentTargets: readonly SmoothClipNativeTarget[];
	endpoints: Partial<Record<"0" | "1", readonly SmoothClipNativeTarget[]>>;
	hostReady: boolean;
	participantFingerprint: string;
	plan: TrustedSmoothClipNativePlan;
	stableParticipants: boolean;
};

const defaultScheduleFrame = (callback: () => void) => {
	if (typeof requestAnimationFrame === "function") {
		requestAnimationFrame(callback);
		return;
	}
	setTimeout(callback, 0);
};

const isDeepFrozen = (value: unknown, seen = new Set<object>()): boolean => {
	if (
		(typeof value !== "object" && typeof value !== "function") ||
		value === null
	) {
		return true;
	}
	if (seen.has(value)) return true;
	seen.add(value);
	if (!Object.isFrozen(value)) return false;
	for (const property of Reflect.ownKeys(value)) {
		if (!isDeepFrozen(Reflect.get(value, property), seen)) return false;
	}
	return true;
};

const planMatchesCapabilities = (
	plan: TrustedSmoothClipNativePlan,
	capabilities: SmoothClipCapabilities,
) => {
	if (
		capabilities.presentationProtocolVersion < plan.protocolVersion ||
		!capabilities.groups ||
		!capabilities.perCornerRadii ||
		!capabilities.contentScale
	) {
		return false;
	}
	return (
		capabilities.continuousCurve ||
		plan.participants.every((participant) => participant.curve === "circular")
	);
};

const rootPriority = (root: RuntimeRoot) =>
	root.kind === "screen"
		? root.rootId
		: Number.MAX_SAFE_INTEGER / 2 + root.rootId;

const createParticipantId = (rootId: number, registrationId: number) =>
	`${rootId}:${registrationId}`;

let nextStoreId = 1;

/**
 * Process-wide route owner. React/UI integrations feed it physical roots,
 * participants and completion legs; it alone may promote trusted built-ins.
 */
export class SmoothClipCoordinatorRuntimeStore {
	private readonly capabilities: () => SmoothClipCapabilities;
	private readonly completionById = new Map<number, CompletionRecord>();
	private readonly groups = new Map<number, NativeGroupRecord>();
	private readonly leaseRegistry: SmoothClipLeaseRegistry;
	private readonly owners = new Map<string, RuntimeOwner>();
	private readonly participants = new Map<string, RuntimeParticipant>();
	private readonly planById = new Map<
		TrustedSmoothClipNativePlan["id"],
		TrustedSmoothClipNativePlan
	>();
	private readonly promotionEnabled: boolean;
	private readonly recordedFrames = new Map<number, RecordedRootFrame>();
	private readonly recordedPlans = new Map<string, RecordedRoutePlan>();
	private readonly roots = new Map<number, RuntimeRoot>();
	private readonly scheduleFrame: (callback: () => void) => void;
	private readonly storeId: string;
	private readonly trustedPlans = new WeakSet<object>();

	constructor({
		capabilities = getSmoothClipCapabilities,
		leaseRegistry = globalSmoothClipLeaseRegistry,
		promotionEnabled = INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION,
		scheduleFrame = defaultScheduleFrame,
		storeId = `runtime-${nextStoreId++}`,
		trustedPlans = [],
	}: RuntimeStoreOptions = {}) {
		this.capabilities = capabilities;
		this.leaseRegistry = leaseRegistry;
		this.promotionEnabled = promotionEnabled;
		this.scheduleFrame = scheduleFrame;
		this.storeId = storeId;
		for (const plan of trustedPlans) this.registerTrustedPlan(plan);
	}

	isEnabled() {
		return this.promotionEnabled;
	}

	private registerTrustedPlan(plan: TrustedSmoothClipNativePlan) {
		if (
			plan.trusted !== true ||
			plan.protocolVersion !== 2 ||
			plan.projectionSpace !== "output" ||
			!isDeepFrozen(plan)
		) {
			throw new Error(
				"SmoothClip native plans must be trusted protocol-v2 immutable metadata.",
			);
		}
		this.trustedPlans.add(plan);
		this.planById.set(plan.id, plan);
	}

	private ensureOwner(routeKey: string) {
		let owner = this.owners.get(routeKey);
		if (owner) return owner;
		owner = {
			completion: null,
			coordinator: new SmoothClipCoordinatorCore({
				coordinatorId: `${this.storeId}:${routeKey}`,
				leaseRegistry: this.leaseRegistry,
			}),
			gestureFrom: new Map(),
			registeredParticipantIds: new Set(),
			routeKey,
			selectedPlan: null,
			suspendedStreams: new Set(),
		};
		this.owners.set(routeKey, owner);
		return owner;
	}

	private rootsForRoute(routeKey: string) {
		return Array.from(this.roots.values())
			.filter((root) => root.routeKey === routeKey)
			.sort((left, right) => rootPriority(left) - rootPriority(right));
	}

	private participantsForRoute(routeKey: string) {
		return Array.from(this.participants.values()).filter(
			(participant) =>
				this.roots.get(participant.rootId)?.routeKey === routeKey,
		);
	}

	registerRoot(root: RuntimeRoot) {
		if (!this.promotionEnabled) return () => {};
		this.roots.set(root.rootId, root);
		return () => this.unregisterRoot(root.rootId);
	}

	moveRoot(rootId: number, routeKey: string) {
		if (!this.promotionEnabled) return;
		const root = this.roots.get(rootId);
		if (!root || root.routeKey === routeKey) return;
		const previousRouteKey = root.routeKey;
		root.routeKey = routeKey;
		this.recordedFrames.delete(rootId);
		this.rebuildRecordedRoute(previousRouteKey);
		this.rebuildRecordedRoute(routeKey);
		this.invalidateParticipantSet(previousRouteKey);
		this.invalidateParticipantSet(routeKey);
	}

	private unregisterRoot(rootId: number) {
		const root = this.roots.get(rootId);
		if (!root) return;
		for (const participant of Array.from(this.participants.values())) {
			if (participant.rootId === rootId) {
				this.unregisterParticipant(
					participant.rootId,
					participant.registrationId,
				);
			}
		}
		this.roots.delete(rootId);
		this.recordedFrames.delete(rootId);
		this.rebuildRecordedRoute(root.routeKey);
		this.invalidateParticipantSet(root.routeKey);
	}

	registerParticipant(registration: SmoothClipRuntimeParticipantRegistration) {
		if (!this.promotionEnabled) return () => {};
		const driverId = registration.driver.__smoothClipHandle?.driverId ?? 0;
		if (!Number.isSafeInteger(driverId) || driverId <= 0) return () => {};
		const participantId = createParticipantId(
			registration.rootId,
			registration.registrationId,
		);
		this.participants.set(participantId, {
			...registration,
			driverId,
			participantId,
		});
		const routeKey = this.roots.get(registration.rootId)?.routeKey;
		if (routeKey) this.invalidateParticipantSet(routeKey);
		return () =>
			this.unregisterParticipant(
				registration.rootId,
				registration.registrationId,
			);
	}

	private unregisterParticipant(rootId: number, registrationId: number) {
		const participantId = createParticipantId(rootId, registrationId);
		const participant = this.participants.get(participantId);
		if (!participant) return;
		const routeKey = this.roots.get(rootId)?.routeKey;
		this.participants.delete(participantId);
		if (routeKey) {
			const owner = this.owners.get(routeKey);
			if (owner?.registeredParticipantIds.delete(participantId)) {
				const activeGroupId = owner.coordinator.getSnapshot().groupId;
				owner.coordinator.unregisterParticipant(participantId);
				this.interruptNative(owner, activeGroupId);
			}
		}
	}

	private invalidateParticipantSet(routeKey: string) {
		this.recordedPlans.delete(routeKey);
		const owner = this.owners.get(routeKey);
		if (!owner || owner.coordinator.getSnapshot().state === "terminal") return;
		this.invalidate(routeKey, "participant");
	}

	beginCompletion({
		completionId,
		onTeardown,
		requiresReset,
		routeKey,
	}: BeginCompletionOptions) {
		if (!this.promotionEnabled) return null;
		const owner = this.ensureOwner(routeKey);
		if (owner.completion?.completionId === completionId) {
			return owner.coordinator.getCompletionToken();
		}

		const previous = owner.coordinator.getSnapshot();
		const replacement = owner.coordinator.replaceTransition({
			routeKey,
			completion: { reanimated: true, reset: requiresReset },
		});
		if (replacement.replacedGroupId !== null) {
			this.cancelDisplacedGroup(previous.groupId, "freeze");
		}
		this.resumeOwnerStreaming(owner);
		if (owner.completion) {
			this.completionById.delete(owner.completion.completionId);
		}
		owner.gestureFrom.clear();
		owner.registeredParticipantIds.clear();
		owner.selectedPlan = null;
		const completion: CompletionRecord = {
			completionId,
			onTeardown,
			routeKey,
			teardownScheduled: false,
			transitionId: replacement.snapshot.transitionId,
		};
		owner.completion = completion;
		this.completionById.set(completionId, completion);
		return replacement.token;
	}

	beginGestureRelease(
		options: BeginCompletionOptions & {
			snapshots: readonly ClipStreamCanonicalSnapshot[];
		},
	) {
		const token = this.beginCompletion(options);
		if (!token) return null;
		const owner = this.owners.get(options.routeKey);
		if (!owner) return null;
		for (const snapshot of options.snapshots) {
			const canonical = canonicalizeClipPresentation(snapshot.presentation);
			if (canonical !== null) {
				owner.gestureFrom.set(snapshot.driverId, canonical);
			}
		}
		const recorded = this.recordedPlans.get(options.routeKey);
		if (recorded) {
			const blockersBySlot = new Map(
				options.snapshots
					.filter((snapshot) => snapshot.planId === recorded.plan.id)
					.map(
						(snapshot) => [snapshot.slotId, snapshot.activeBlockers] as const,
					),
			);
			recorded.currentTargets = recorded.currentTargets.map((target) => ({
				...target,
				activeBlockers:
					blockersBySlot.get(target.slotId) ?? target.activeBlockers,
			}));
		}
		return token;
	}

	private resolveCompletion(completionId: number) {
		const completion = this.completionById.get(completionId);
		if (!completion) return null;
		const owner = this.owners.get(completion.routeKey);
		if (!owner) return null;
		const snapshot = owner.coordinator.getSnapshot();
		if (snapshot.transitionId !== completion.transitionId) return null;
		return { completion, owner };
	}

	completeReanimated(completionId: number, finished: boolean) {
		return this.completeLeg(completionId, "reanimated", finished);
	}

	completeReset(completionId: number, finished: boolean) {
		return this.completeLeg(completionId, "reset", finished);
	}

	private completeLeg(
		completionId: number,
		leg: "reanimated" | "reset",
		finished: boolean,
	) {
		const resolved = this.resolveCompletion(completionId);
		if (!resolved) return false;
		const token = resolved.owner.coordinator.getCompletionToken();
		if (!token) return false;
		const result = resolved.owner.coordinator.completeLeg(leg, token, finished);
		if (result.becameTerminal) {
			this.resumeOwnerStreaming(resolved.owner);
			this.scheduleTeardown(resolved.completion);
		}
		return result.accepted;
	}

	private scheduleTeardown(completion: CompletionRecord) {
		if (completion.teardownScheduled) return;
		completion.teardownScheduled = true;
		this.scheduleFrame(() => {
			this.scheduleFrame(() => {
				const owner = this.owners.get(completion.routeKey);
				if (
					this.completionById.get(completion.completionId) !== completion ||
					owner?.completion !== completion ||
					owner.coordinator.getSnapshot().transitionId !==
						completion.transitionId
				) {
					return;
				}
				this.completionById.delete(completion.completionId);
				owner.completion = null;
				completion.onTeardown?.(true);
			});
		});
	}

	private selectPlanParticipants(
		owner: RuntimeOwner,
		plan: TrustedSmoothClipNativePlan,
	) {
		return this.participantsForRoute(owner.routeKey).filter(
			(participant) => participant.trustedPlans?.includes(plan) === true,
		);
	}

	private synchronizeSelectedParticipants(
		owner: RuntimeOwner,
		participants: readonly RuntimeParticipant[],
	) {
		const selectedIds = new Set(
			participants.map((participant) => participant.participantId),
		);
		for (const participantId of owner.registeredParticipantIds) {
			if (selectedIds.has(participantId)) continue;
			owner.registeredParticipantIds.delete(participantId);
			owner.coordinator.unregisterParticipant(participantId);
		}
		for (const participant of participants) {
			owner.registeredParticipantIds.add(participant.participantId);
			owner.coordinator.registerParticipant({
				participantId: participant.participantId,
				driverId: participant.driverId,
				// SmoothClip's native group snapshot is the authoritative readiness
				// preflight; registered native drivers start optimistically ready.
				ready: true,
				nativeEligible: true,
			});
		}
	}

	private validateTargets(
		plan: TrustedSmoothClipNativePlan,
		participants: readonly RuntimeParticipant[],
		targets: readonly SmoothClipNativeTarget[],
	) {
		const targetBySlot = new Map(
			targets.map((target) => [target.slotId, target]),
		);
		if (
			targetBySlot.size !== targets.length ||
			plan.participants.some(
				(planParticipant) =>
					!targetBySlot.has(planParticipant.slotId) ||
					!participants.some(
						(participant) => participant.slotId === planParticipant.slotId,
					),
			) ||
			participants.some((participant) => !targetBySlot.has(participant.slotId))
		) {
			return "participant-mismatch" as const;
		}
		for (const planParticipant of plan.participants) {
			const target = targetBySlot.get(planParticipant.slotId);
			if (
				target?.activeBlockers?.some((blocker) =>
					planParticipant.promotionBlockers.includes(blocker),
				)
			) {
				return "geometric-blocker" as const;
			}
		}
		return targetBySlot;
	}

	private participantFingerprint(participants: readonly RuntimeParticipant[]) {
		return participants
			.map(
				(participant) => `${participant.participantId}:${participant.driverId}`,
			)
			.sort()
			.join("|");
	}

	private suspendOwnerStreaming(
		owner: RuntimeOwner,
		participants: readonly RuntimeParticipant[],
	) {
		for (const participant of participants) {
			participant.streamingSuspended.set(1);
			owner.suspendedStreams.add(participant.streamingSuspended);
		}
	}

	private resumeOwnerStreaming(owner: RuntimeOwner) {
		for (const suspended of owner.suspendedStreams) suspended.set(0);
		owner.suspendedStreams.clear();
	}

	private rebuildRecordedRoute(routeKey: string) {
		const frames = Array.from(this.recordedFrames.values()).filter(
			(record) => record.routeKey === routeKey,
		);
		const previous = this.recordedPlans.get(routeKey);
		if (frames.length === 0) {
			if (previous) previous.active = false;
			return;
		}
		const planId = frames[0]?.frame.planId;
		if (
			planId === undefined ||
			frames.some((record) => record.frame.planId !== planId)
		) {
			if (previous) previous.active = false;
			return;
		}
		const plan = this.planById.get(planId);
		if (!plan || !this.trustedPlans.has(plan)) {
			if (previous) previous.active = false;
			return;
		}
		const participants = this.participantsForRoute(routeKey).filter(
			(participant) => participant.trustedPlans?.includes(plan) === true,
		);
		const targetBySlot = new Map<string, SmoothClipNativeTarget>();
		for (const record of frames) {
			for (const target of record.frame.targets) {
				const canonical = canonicalizeClipPresentation(target.target);
				if (canonical === null) {
					if (previous) previous.active = false;
					return;
				}
				targetBySlot.set(target.slotId, { ...target, target: canonical });
			}
		}
		if (
			participants.length === 0 ||
			plan.participants.some(
				(participant) => !targetBySlot.has(participant.slotId),
			) ||
			participants.some((participant) => !targetBySlot.has(participant.slotId))
		) {
			if (previous) previous.active = false;
			return;
		}
		const progress = frames[0]?.frame.progress ?? Number.NaN;
		if (
			!Number.isFinite(progress) ||
			frames.some((record) => Math.abs(record.frame.progress - progress) > 1e-6)
		) {
			if (previous) previous.active = false;
			return;
		}
		const participantFingerprint = this.participantFingerprint(participants);
		const currentTargets = Array.from(targetBySlot.values());
		const recorded: RecordedRoutePlan =
			previous?.plan === plan &&
			previous.participantFingerprint === participantFingerprint
				? previous
				: {
						active: true,
						currentTargets,
						endpoints: {},
						hostReady: false,
						participantFingerprint,
						plan,
						stableParticipants: false,
					};
		recorded.active = true;
		recorded.currentTargets = currentTargets;
		recorded.hostReady = frames.every((record) => record.frame.hostReady);
		recorded.stableParticipants =
			recorded.hostReady &&
			frames.every((record) => record.frame.participantFingerprint.length > 0);
		if (Math.abs(progress) <= 1e-6) recorded.endpoints["0"] = currentTargets;
		if (Math.abs(progress - 1) <= 1e-6)
			recorded.endpoints["1"] = currentTargets;
		this.recordedPlans.set(routeKey, recorded);
	}

	recordBuiltInFrame(
		rootId: number,
		routeKey: string,
		frame: SmoothClipRecordedNativeFrame | null,
	) {
		if (!this.promotionEnabled) return;
		const root = this.roots.get(rootId);
		if (!root || root.routeKey !== routeKey) return;
		const previousRouteKey = this.recordedFrames.get(rootId)?.routeKey;
		if (frame === null) {
			this.recordedFrames.delete(rootId);
		} else {
			this.recordedFrames.set(rootId, { frame, rootId, routeKey });
		}
		if (previousRouteKey && previousRouteKey !== routeKey) {
			this.rebuildRecordedRoute(previousRouteKey);
		}
		this.rebuildRecordedRoute(routeKey);
	}

	requestRecordedBuiltInPromotion({
		animation,
		routeKey,
		source,
		targetProgress,
	}: Readonly<{
		animation:
			| SmoothClipGroupMotionAnimation
			| SmoothClipGroupKeyframeAnimation;
		routeKey: string;
		source: "transition" | "gesture-release";
		targetProgress: number;
	}>) {
		if (!this.promotionEnabled) {
			return Promise.resolve<SmoothClipNativePromotionResult>({
				status: "unavailable",
				reason: "disabled",
				groupId: null,
			});
		}
		const recorded = this.recordedPlans.get(routeKey);
		const endpointKey =
			Math.abs(targetProgress) <= 1e-6
				? ("0" as const)
				: Math.abs(targetProgress - 1) <= 1e-6
					? ("1" as const)
					: null;
		const endpoint = endpointKey ? recorded?.endpoints[endpointKey] : undefined;
		if (!recorded?.active || endpoint === undefined) {
			return Promise.resolve<SmoothClipNativePromotionResult>({
				status: "streaming",
				reason: "participant-mismatch",
				groupId: null,
			});
		}
		const currentBlockers = new Map(
			recorded.currentTargets.map((target) => [
				target.slotId,
				target.activeBlockers,
			]),
		);
		return this.requestNativePromotion({
			animation,
			hostReady: recorded.hostReady,
			plan: recorded.plan,
			routeKey,
			source,
			stableParticipants: recorded.stableParticipants,
			targets: endpoint.map((target) => ({
				...target,
				activeBlockers: currentBlockers.get(target.slotId),
			})),
		});
	}

	private tokenIsCurrent(
		owner: RuntimeOwner,
		token: SmoothClipCompletionToken,
		state: "tracking" | "native",
	) {
		const snapshot = owner.coordinator.getSnapshot();
		return (
			snapshot.state === state &&
			snapshot.ownerRouteKey === token.ownerRouteKey &&
			snapshot.transitionId === token.transitionId &&
			snapshot.ownershipEpoch === token.ownershipEpoch &&
			snapshot.groupId === token.groupId
		);
	}

	async requestNativePromotion({
		animation,
		hostReady,
		plan,
		routeKey,
		source,
		stableParticipants,
		targets,
	}: NativePromotionRequest): Promise<SmoothClipNativePromotionResult> {
		if (!this.promotionEnabled) {
			return { status: "unavailable", reason: "disabled", groupId: null };
		}
		if (!this.trustedPlans.has(plan) || !isDeepFrozen(plan)) {
			return { status: "fallback", reason: "untrusted-plan", groupId: null };
		}
		if (!planMatchesCapabilities(plan, this.capabilities())) {
			return { status: "fallback", reason: "capabilities", groupId: null };
		}
		if (plan.requiresReadyFixedHost && !hostReady) {
			return { status: "streaming", reason: "host-not-ready", groupId: null };
		}
		if (plan.requiresStableInputs && !stableParticipants) {
			return {
				status: "streaming",
				reason: "unstable-participants",
				groupId: null,
			};
		}

		const owner = this.ensureOwner(routeKey);
		if (owner.coordinator.getSnapshot().state === "terminal") {
			return {
				status: "streaming",
				reason: "invalid-state",
				groupId: null,
			};
		}
		const participants = this.selectPlanParticipants(owner, plan);
		const targetBySlot = this.validateTargets(plan, participants, targets);
		if (typeof targetBySlot === "string" || participants.length === 0) {
			return {
				status: "streaming",
				reason:
					targetBySlot === "geometric-blocker"
						? targetBySlot
						: "participant-mismatch",
				groupId: null,
			};
		}
		const root = this.rootsForRoute(routeKey)[0];
		if (!root) {
			return { status: "streaming", reason: "no-root", groupId: null };
		}
		owner.selectedPlan = plan;
		this.synchronizeSelectedParticipants(owner, participants);
		const readinessToken = owner.coordinator.getCompletionToken();
		if (
			readinessToken === null ||
			!this.tokenIsCurrent(owner, readinessToken, "tracking")
		) {
			return { status: "streaming", reason: "stale", groupId: null };
		}
		const fingerprint = this.participantFingerprint(participants);
		const drivers = participants.map((participant) => participant.driver);
		let readiness: readonly SmoothClipGroupSnapshot[];
		try {
			readiness = await root.driver.react.snapshotCurrent(drivers);
		} catch {
			return { status: "streaming", reason: "not-ready", groupId: null };
		}
		if (
			fingerprint !==
			this.participantFingerprint(this.selectPlanParticipants(owner, plan))
		) {
			return {
				status: "streaming",
				reason: "unstable-participants",
				groupId: null,
			};
		}
		if (!this.tokenIsCurrent(owner, readinessToken, "tracking")) {
			return { status: "streaming", reason: "stale", groupId: null };
		}
		const expectedDriverIds = new Set(
			participants.map((participant) => participant.driverId),
		);
		const snapshotDriverIds = new Set<number>();
		for (const snapshot of readiness) {
			const driverId = snapshot.driver.__smoothClipHandle?.driverId;
			if (
				driverId === undefined ||
				!expectedDriverIds.has(driverId) ||
				snapshotDriverIds.has(driverId)
			) {
				return { status: "streaming", reason: "not-ready", groupId: null };
			}
			snapshotDriverIds.add(driverId);
			const participant = participants.find(
				(entry) => entry.driverId === driverId,
			);
			if (participant) {
				owner.coordinator.setParticipantReady(
					participant.participantId,
					snapshot.ready,
				);
			}
		}
		if (
			snapshotDriverIds.size !== expectedDriverIds.size ||
			readiness.some((entry) => !entry.ready)
		) {
			return { status: "streaming", reason: "not-ready", groupId: null };
		}
		const animationToken = owner.coordinator.getCompletionToken();
		if (
			animationToken === null ||
			!this.tokenIsCurrent(owner, animationToken, "tracking")
		) {
			return { status: "streaming", reason: "stale", groupId: null };
		}

		const preflight = owner.coordinator.preflightNativePromotion();
		if (preflight.status !== "ready") {
			return {
				status: preflight.status === "fallback" ? "fallback" : "streaming",
				reason:
					preflight.reason === "ambiguous-lease"
						? "ambiguous-lease"
						: preflight.reason === "unsupported-geometry"
							? "unsupported-geometry"
							: "invalid-state",
				groupId: null,
			};
		}

		const motionEntries: SmoothClipGroupMotionEntry[] = [];
		const keyframeEntries: SmoothClipGroupKeyframeEntry[] = [];
		for (const participant of participants) {
			const target = targetBySlot.get(participant.slotId);
			if (!target) continue;
			const from =
				source === "gesture-release"
					? owner.gestureFrom.get(participant.driverId)
					: undefined;
			if (source === "gesture-release" && from === undefined) {
				return { status: "streaming", reason: "stale", groupId: null };
			}
			if (animation.type === "keyframes") {
				if (!target.frames) {
					return {
						status: "streaming",
						reason: "participant-mismatch",
						groupId: null,
					};
				}
				keyframeEntries.push({
					driver: participant.driver,
					target: target.target,
					frames: target.frames,
					...(from === undefined ? {} : { from }),
				});
			} else {
				motionEntries.push({
					driver: participant.driver,
					target: target.target,
					...(from === undefined ? {} : { from }),
				});
			}
		}

		this.suspendOwnerStreaming(owner, participants);
		let groupId: number;
		try {
			groupId =
				animation.type === "keyframes"
					? await root.driver.react.animateTo(keyframeEntries, {
							...animation,
							suspensionPolicy:
								animation.suspensionPolicy ??
								(source === "gesture-release" ? "finish" : "pause"),
						})
					: await root.driver.react.animateTo(motionEntries, {
							...animation,
							suspensionPolicy:
								animation.suspensionPolicy ??
								(source === "gesture-release" ? "finish" : "pause"),
						});
		} catch {
			this.resumeOwnerStreaming(owner);
			return { status: "streaming", reason: "invalid-state", groupId: null };
		}
		if (!this.tokenIsCurrent(owner, animationToken, "tracking")) {
			try {
				await root.driver.react.cancel(groupId, "freeze");
			} catch {
				// The stale native start is already disowned by the current token.
			}
			this.resumeOwnerStreaming(owner);
			return { status: "streaming", reason: "stale", groupId: null };
		}
		const promotion = owner.coordinator.tryBeginNative(groupId);
		if (promotion.status !== "native" || promotion.token === null) {
			try {
				await root.driver.react.cancel(groupId, "freeze");
			} finally {
				this.resumeOwnerStreaming(owner);
			}
			return { status: "streaming", reason: "invalid-state", groupId: null };
		}
		this.groups.set(groupId, {
			driver: root.driver,
			drivers,
			groupId,
			rootId: root.rootId,
			routeKey,
			token: promotion.token,
		});
		return { status: "native", reason: "promoted", groupId };
	}

	/** Native-to-native retargeting intentionally never writes an explicit from. */
	async retargetNative(request: NativeRetargetRequest) {
		const owner = this.owners.get(request.routeKey);
		const activeGroupId = owner?.coordinator.getSnapshot().groupId ?? null;
		if (owner && activeGroupId !== null) {
			owner.coordinator.invalidateOwnership("participant");
			await this.freezeOwner(owner, activeGroupId);
		}
		return this.requestNativePromotion({
			...request,
			source: "transition",
			stableParticipants: true,
		});
	}

	handleGroupCompletion(
		rootId: number,
		result: SmoothClipGroupAnimationResult,
	) {
		const record = this.groups.get(result.groupId);
		if (!record || record.rootId !== rootId) return;
		this.groups.delete(result.groupId);
		const owner = this.owners.get(record.routeKey);
		if (!owner) return;

		const settle = (snapshots: readonly SmoothClipGroupSnapshot[]) => {
			const current = owner.coordinator.getSnapshot();
			if (
				current.ownerRouteKey !== record.token.ownerRouteKey ||
				current.transitionId !== record.token.transitionId ||
				current.groupId !== record.groupId ||
				(current.state !== "native" && current.state !== "interrupting")
			) {
				return;
			}
			for (const snapshot of snapshots) {
				const driverId = snapshot.driver.__smoothClipHandle?.driverId;
				if (driverId) owner.gestureFrom.set(driverId, snapshot.presentation);
			}
			const completion =
				current.state === "interrupting"
					? owner.coordinator.completeInterruption(
							owner.coordinator.getCompletionToken() ?? record.token,
						)
					: owner.coordinator.completeNative(record.token, result.finished);
			if (completion.demoted || completion.becameTerminal) {
				this.resumeOwnerStreaming(owner);
			}
			if (completion.becameTerminal && owner.completion) {
				this.scheduleTeardown(owner.completion);
			}
		};

		if (result.finished) {
			settle([]);
			return;
		}
		void record.driver.react
			.snapshotCurrent(record.drivers)
			.then(settle)
			.catch(() => settle([]));
	}

	private cancelDisplacedGroup(
		groupId: number | null,
		behavior: "freeze" | "finish",
	) {
		if (groupId === null) return;
		const record = this.groups.get(groupId);
		if (!record) return;
		this.groups.delete(groupId);
		void record.driver.react.cancel(groupId, behavior).catch(() => {
			// Route replacement/detach already released logical ownership.
		});
	}

	private interruptNative(owner: RuntimeOwner, groupId: number | null) {
		if (groupId === null) return;
		const snapshot = owner.coordinator.getSnapshot();
		if (snapshot.state !== "interrupting") return;
		if (!this.groups.has(groupId)) {
			return;
		}
		void this.freezeOwner(owner, groupId);
	}

	private async freezeOwner(owner: RuntimeOwner, groupId: number) {
		const record = this.groups.get(groupId);
		if (!record) return;
		this.groups.delete(groupId);
		let snapshots: readonly SmoothClipGroupSnapshot[] = [];
		try {
			snapshots = await record.driver.react.cancel(groupId, "freeze");
		} catch {
			// Cancellation is best-effort; ownership must still leave interrupting.
		}
		const current = owner.coordinator.getSnapshot();
		if (
			current.state !== "interrupting" ||
			current.groupId !== groupId ||
			current.transitionId !== record.token.transitionId ||
			current.ownerRouteKey !== record.token.ownerRouteKey
		) {
			return;
		}
		for (const snapshot of snapshots) {
			const driverId = snapshot.driver.__smoothClipHandle?.driverId;
			if (driverId) owner.gestureFrom.set(driverId, snapshot.presentation);
		}
		const interruptionToken = owner.coordinator.getCompletionToken();
		if (!interruptionToken) return;
		owner.coordinator.completeInterruption(interruptionToken);
		this.resumeOwnerStreaming(owner);
	}

	invalidate(routeKey: string, reason: SmoothClipOwnershipInvalidationReason) {
		this.recordedPlans.delete(routeKey);
		const owner = this.owners.get(routeKey);
		if (!owner) return false;
		const groupId = owner.coordinator.getSnapshot().groupId;
		const invalidated = owner.coordinator.invalidateOwnership(reason);
		if (invalidated) this.interruptNative(owner, groupId);
		return invalidated;
	}

	notifyRelayout(routeKey: string) {
		return this.invalidate(routeKey, "relayout");
	}

	notifyPortalChanged(routeKey: string) {
		return this.invalidate(routeKey, "portal");
	}

	notifyReadinessChanged(routeKey: string, driverId: number, ready: boolean) {
		const owner = this.owners.get(routeKey);
		if (!owner) return false;
		const participant = this.participantsForRoute(routeKey).find(
			(entry) => entry.driverId === driverId,
		);
		if (
			!participant ||
			!owner.registeredParticipantIds.has(participant.participantId)
		) {
			return false;
		}
		const groupId = owner.coordinator.getSnapshot().groupId;
		const changed = owner.coordinator.setParticipantReady(
			participant.participantId,
			ready,
		);
		if (changed) this.interruptNative(owner, groupId);
		return changed;
	}

	detachRoute(routeKey: string) {
		const owner = this.owners.get(routeKey);
		if (!owner) return false;
		const ownedRoute =
			owner.coordinator.getSnapshot().ownerRouteKey === routeKey;
		const result = owner.coordinator.detachRoute(routeKey);
		this.cancelDisplacedGroup(result.groupIdToFinish, "finish");
		this.resumeOwnerStreaming(owner);
		if (owner.completion) {
			this.completionById.delete(owner.completion.completionId);
		}
		if (result.accepted || ownedRoute) {
			owner.completion = null;
			owner.gestureFrom.clear();
			owner.registeredParticipantIds.clear();
			owner.selectedPlan = null;
			this.owners.delete(routeKey);
			this.recordedPlans.delete(routeKey);
			for (const [rootId, record] of this.recordedFrames) {
				if (record.routeKey === routeKey) this.recordedFrames.delete(rootId);
			}
		}
		return result.accepted;
	}

	finishRoute(routeKey: string) {
		const owner = this.owners.get(routeKey);
		const token = owner?.coordinator.getCompletionToken();
		if (!owner || !token) return false;
		const result = owner.coordinator.finishTransition(token);
		this.cancelDisplacedGroup(result.groupIdToFinish, "finish");
		this.resumeOwnerStreaming(owner);
		if (owner.completion) {
			this.completionById.delete(owner.completion.completionId);
			owner.completion = null;
		}
		this.recordedPlans.delete(routeKey);
		return result.accepted;
	}

	finishAll() {
		for (const routeKey of this.owners.keys()) this.finishRoute(routeKey);
	}

	getSnapshot(routeKey: string): SmoothClipCoordinatorSnapshot | null {
		return this.owners.get(routeKey)?.coordinator.getSnapshot() ?? null;
	}
}

export const globalSmoothClipCoordinatorRuntime =
	new SmoothClipCoordinatorRuntimeStore({
		trustedPlans: [ZOOM_CLIP_NATIVE_PLAN, REVEAL_CLIP_NATIVE_PLAN],
	});
