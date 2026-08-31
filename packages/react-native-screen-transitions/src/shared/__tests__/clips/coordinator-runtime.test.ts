import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import {
	type CanonicalSmoothClipPresentation,
	canonicalizeClipPresentation,
	type SmoothClipDriver,
	type SmoothClipGroupDriver,
	type SmoothClipGroupSnapshot,
} from "react-native-smooth-clip-view";
import {
	flushClipStreamRouteOnUI,
	registerClipStreamRootOnUI,
	unregisterClipStreamRootOnUI,
} from "../../providers/screen/clip/clip-stream-ui";
import {
	SmoothClipLeaseRegistry,
} from "../../providers/screen/clips/coordinator";
import { resolveSmoothClipNativeAnimation } from "../../providers/screen/clips/coordinator/native-animation";
import { SmoothClipCoordinatorRuntimeStore } from "../../providers/screen/clips/coordinator/runtime-store";
import {
	sampleFinalPanGestureAndFlush,
	trackPanGestureAndFlush,
} from "../../providers/screen/gestures/pan/behavior/pan-lifecycle";
import {
	sampleFinalPinchGestureAndFlush,
	trackPinchGestureAndFlush,
} from "../../providers/screen/gestures/pinch/behavior/pinch-lifecycle";
import { defineBuiltInClipNativePlan } from "../../utils/bounds/navigation/clip/native-plan";
import { getBuiltInClipRuntimeMarker } from "../../utils/bounds/navigation/clip/runtime-metadata";
import { adaptRevealFocusedContentClip } from "../../utils/bounds/navigation/reveal/adapter";
import { REVEAL_CLIP_NATIVE_PLAN } from "../../utils/bounds/navigation/reveal/native-plan";
import { adaptZoomFocusedContentClip } from "../../utils/bounds/navigation/zoom/adapter";
import { ZOOM_CLIP_NATIVE_PLAN } from "../../utils/bounds/navigation/zoom/native-plan";

const PRESENTATION = canonicalizeClipPresentation({
	clip: { x: 0, y: 0, width: 100, height: 120, radius: 12 },
	contentTranslateX: 0,
	contentTranslateY: 0,
	contentScale: 1,
});

if (PRESENTATION === null) throw new Error("Invalid test presentation");

const TARGET = canonicalizeClipPresentation({
	clip: { x: 10, y: 20, width: 180, height: 220, radius: 24 },
	contentTranslateX: 4,
	contentTranslateY: 8,
	contentScale: 0.9,
});

if (TARGET === null) throw new Error("Invalid test target");

const TIMING = {
	type: "timing" as const,
	duration: 240,
	controlPoints: [0.2, 0, 0, 1] as const,
};

const createMutable = <T>(initial: T) => {
	let current = initial;
	return {
		get: () => current,
		set: (next: T | ((value: T) => T)) => {
			current = typeof next === "function" ? (next as (value: T) => T)(current) : next;
		},
		get value() {
			return current;
		},
		set value(next: T) {
			current = next;
		},
	} as unknown as SharedValue<T>;
};

let nextDriverId = 1;

const createDriver = (ready = true): SmoothClipDriver => {
	const driverId = nextDriverId++;
	const presentation = createMutable(PRESENTATION);
	return {
		kind: "hybrid",
		presentation,
		ui: {
			beginInteraction: () => PRESENTATION,
			set: () => {},
			setScalars: () => {},
			setPresentationScalars: () => {},
			animateTo: () => 1,
			cancel: () => PRESENTATION,
		},
		react: {
			beginInteraction: async () => PRESENTATION,
			set: async () => {},
			animateTo: async () => 1,
			cancel: async () => PRESENTATION,
		},
		__smoothClipHandle: {
			driverId,
			presentation,
			ownership: createMutable(0),
			activeAnimationId: createMutable(0),
			disposed: createMutable(0),
			ready: createMutable(ready ? 1 : 0),
		},
	};
};

type GroupHarness = ReturnType<typeof createGroupHarness>;

const createGroupHarness = () => {
	let nextGroupId = 100;
	let animateOverride:
		| ((
				entries: readonly Record<string, unknown>[],
				animation: Record<string, unknown>,
			) => Promise<number>)
		| null = null;
	let snapshotOverride:
		| ((drivers: readonly SmoothClipDriver[]) => Promise<readonly SmoothClipGroupSnapshot[]>)
		| null = null;
	const animateCalls: { entries: readonly Record<string, unknown>[]; animation: Record<string, unknown> }[] = [];
	const cancelCalls: { groupId: number; behavior: string }[] = [];
	const setBatchCalls: readonly Record<string, unknown>[][] = [];
	const snapshots = (drivers: readonly SmoothClipDriver[]) =>
		drivers.map((driver) => ({
			driver,
			presentation: PRESENTATION,
			ready: driver.__smoothClipHandle?.ready?.get() !== 0,
		}));
	const driver = {
		kind: "group",
		ui: {
			beginInteraction: snapshots,
			snapshotCurrent: snapshots,
			setBatch: (entries: readonly Record<string, unknown>[]) => {
				setBatchCalls.push(entries);
			},
			animateTo: () => nextGroupId++,
			cancel: () => [],
		},
		react: {
			beginInteraction: async (drivers: readonly SmoothClipDriver[]) =>
				snapshots(drivers),
			snapshotCurrent: (drivers: readonly SmoothClipDriver[]) =>
				snapshotOverride
					? snapshotOverride(drivers)
					: Promise.resolve(snapshots(drivers)),
			setBatch: async () => {},
			animateTo: async (
				entries: readonly Record<string, unknown>[],
				animation: Record<string, unknown>,
			) => {
				animateCalls.push({ entries, animation });
				return animateOverride
					? animateOverride(entries, animation)
					: nextGroupId++;
			},
			cancel: async (groupId: number, behavior = "freeze") => {
				cancelCalls.push({ groupId, behavior });
				return [];
			},
		},
	} as unknown as SmoothClipGroupDriver;
	return {
		animateCalls,
		cancelCalls,
		driver,
		setBatchCalls,
		setAnimateOverride: (override: typeof animateOverride) => {
			animateOverride = override;
		},
		setSnapshotOverride: (override: typeof snapshotOverride) => {
			snapshotOverride = override;
		},
	};
};

const createPlan = () =>
	defineBuiltInClipNativePlan({
		id: "zoom",
		protocolVersion: 2,
		trusted: true,
		projectionSpace: "output",
		requiresReadyFixedHost: true,
		requiresStableInputs: true,
		participants: [
			{
				slotId: "content",
				geometry: "uniform-corners",
				curve: "circular",
				ownsContentTranslation: true,
				ownsContentScale: true,
				residualChannels: ["opacity"],
				promotionBlockers: ["rotation"],
			},
		],
	});

const createStore = (
	plan = createPlan(),
	options: Partial<ConstructorParameters<typeof SmoothClipCoordinatorRuntimeStore>[0]> = {},
) => ({
	plan,
	store: new SmoothClipCoordinatorRuntimeStore({
		leaseRegistry: new SmoothClipLeaseRegistry(),
		promotionEnabled: true,
		storeId: `test-${nextDriverId}`,
		trustedPlans: [plan],
		...options,
	}),
});

const register = ({
	driver = createDriver(),
	harness,
	kind = "screen" as const,
	plan,
	registrationId = 1,
	rootId = 1,
	routeKey = "route-B",
	store,
}: {
	driver?: SmoothClipDriver;
	harness: GroupHarness;
	kind?: "screen" | "float-overlay";
	plan?: ReturnType<typeof createPlan>;
	registrationId?: number;
	rootId?: number;
	routeKey?: string;
	store: SmoothClipCoordinatorRuntimeStore;
}) => {
	store.registerRoot({ driver: harness.driver, kind, rootId, routeKey });
	store.registerParticipant({
		driver,
		registrationId,
		rootId,
		slotId: "content",
		streamingSuspended: createMutable(0),
		trustedPlans: plan ? [plan] : undefined,
	});
	return driver;
};

const promote = (
	store: SmoothClipCoordinatorRuntimeStore,
	plan: ReturnType<typeof createPlan>,
	source: "transition" | "gesture-release" = "transition",
) =>
	store.requestNativePromotion({
		animation: TIMING,
		hostReady: true,
		plan,
		routeKey: "route-B",
		source,
		stableParticipants: true,
		targets: [{ slotId: "content", target: TARGET }],
	});

describe("SmoothClipCoordinatorRuntimeStore", () => {
	it("keeps native promotion compiled off by default", async () => {
		const plan = createPlan();
		const store = new SmoothClipCoordinatorRuntimeStore({ trustedPlans: [plan] });
		expect(await promote(store, plan)).toEqual({
			status: "unavailable",
			reason: "disabled",
			groupId: null,
		});
	});

	it("rejects lookalike metadata and arbitrary streamed ClipViews", async () => {
		const { plan, store } = createStore();
		const harness = createGroupHarness();
		register({ harness, store });
		store.beginCompletion({
			completionId: 1,
			requiresReset: false,
			routeKey: "route-B",
		});
		const lookalike = createPlan();
		expect(await promote(store, lookalike)).toMatchObject({
			status: "fallback",
			reason: "untrusted-plan",
		});
		expect(await promote(store, plan)).toMatchObject({
			status: "streaming",
			reason: "participant-mismatch",
		});
		expect(harness.animateCalls).toHaveLength(0);
	});

	it("marks only built-in zoom/reveal projector output with internal provenance", () => {
		const zoom = adaptZoomFocusedContentClip({
			legacyStyle: {},
			projectedClip: TARGET,
			rotation: 0,
		}) as { clip?: typeof TARGET };
		const reveal = adaptRevealFocusedContentClip({
			legacyStyle: {},
			projectedClip: TARGET,
		}) as { clip?: typeof TARGET };
		expect(getBuiltInClipRuntimeMarker(zoom.clip)).toMatchObject({
			planId: "zoom",
			slotId: "content",
		});
		expect(getBuiltInClipRuntimeMarker(reveal.clip)).toMatchObject({
			planId: "reveal",
			slotId: "content",
		});
		expect(getBuiltInClipRuntimeMarker(TARGET)).toBeNull();
	});

	it("maps only compatible lifecycle motion into native animations", () => {
		expect(
			resolveSmoothClipNativeAnimation(
				{ damping: 80, mass: 3, stiffness: 900 },
				"gesture-release",
			),
		).toEqual({
			type: "spring",
			damping: 80,
			initialVelocity: "inherit",
			mass: 3,
			stiffness: 900,
		});
		expect(
			resolveSmoothClipNativeAnimation(
				{ duration: 200, easing: () => 0.5 },
				"transition",
			),
		).toBeNull();
	});

	it.each([
		["zoom", ZOOM_CLIP_NATIVE_PLAN],
		["reveal", REVEAL_CLIP_NATIVE_PLAN],
	] as const)(
		"submits the trusted %s built-in endpoint through the enabled runtime",
		async (_name, plan) => {
			const harness = createGroupHarness();
			const store = new SmoothClipCoordinatorRuntimeStore({
				leaseRegistry: new SmoothClipLeaseRegistry(),
				promotionEnabled: true,
				storeId: `built-in-${plan.id}`,
				trustedPlans: [plan],
			});
			store.registerRoot({
				driver: harness.driver,
				kind: "screen",
				rootId: 91,
				routeKey: "route-built-in",
			});
			const streamingSuspensions: SharedValue<number>[] = [];
			for (const [index, participant] of plan.participants.entries()) {
				const streamingSuspended = createMutable(0);
				streamingSuspensions.push(streamingSuspended);
				store.registerParticipant({
					driver: createDriver(),
					registrationId: index + 1,
					rootId: 91,
					slotId: participant.slotId,
					streamingSuspended,
					trustedPlans: [plan],
				});
			}
			const endpointTargets = plan.participants.map((participant) => ({
				slotId: participant.slotId,
				target: PRESENTATION,
			}));
			const settledTargets = plan.participants.map((participant) => ({
				slotId: participant.slotId,
				target: TARGET,
			}));
			store.recordBuiltInFrame(91, "route-built-in", {
				hostReady: true,
				participantFingerprint: "stable-built-in-hosts",
				planId: plan.id,
				progress: 0,
				targets: endpointTargets,
			});
			store.recordBuiltInFrame(91, "route-built-in", {
				hostReady: true,
				participantFingerprint: "stable-built-in-hosts",
				planId: plan.id,
				progress: 1,
				targets: settledTargets,
			});
			store.beginCompletion({
				completionId: 90,
				requiresReset: false,
				routeKey: "route-built-in",
			});
			const result = await store.requestRecordedBuiltInPromotion({
				animation: TIMING,
				routeKey: "route-built-in",
				source: "transition",
				targetProgress: 0,
			});
			expect(result).toMatchObject({ reason: "promoted", status: "native" });
			expect(harness.animateCalls[0]?.entries).toHaveLength(
				plan.participants.length,
			);
			expect(streamingSuspensions.every((value) => value.get() === 1)).toBe(
				true,
			);
			store.handleGroupCompletion(91, {
				finished: true,
				groupId: result.groupId ?? 0,
			});
			expect(streamingSuspensions.every((value) => value.get() === 1)).toBe(
				true,
			);
			store.completeReanimated(90, true);
			expect(streamingSuspensions.every((value) => value.get() === 0)).toBe(
				true,
			);
		},
	);

	it("joins screen and FloatOverlay roots under the active route owner", async () => {
		const { plan, store } = createStore();
		const screen = createGroupHarness();
		const overlay = createGroupHarness();
		register({ harness: overlay, kind: "float-overlay", plan, rootId: 1, store });
		register({
			harness: screen,
			plan,
			registrationId: 2,
			rootId: 2,
			store,
		});
		store.beginCompletion({
			completionId: 2,
			requiresReset: false,
			routeKey: "route-B",
		});
		const result = await promote(store, plan);
		expect(result.status).toBe("native");
		expect(screen.animateCalls[0]?.entries).toHaveLength(2);
		expect(overlay.animateCalls).toHaveLength(0);
		expect(store.getSnapshot("route-B")?.participants).toHaveLength(2);
	});

	it("moves a physical root to the frame's active route key", async () => {
		const { plan, store } = createStore();
		const harness = createGroupHarness();
		register({ harness, plan, routeKey: "route-A", store });
		store.moveRoot(1, "route-B");
		store.beginCompletion({
			completionId: 21,
			requiresReset: false,
			routeKey: "route-B",
		});
		expect((await promote(store, plan)).status).toBe("native");
		expect(store.getSnapshot("route-B")?.ownerRouteKey).toBe("route-B");
	});

	it("uses authoritative snapshot readiness and detects participant churn", async () => {
		const { plan, store } = createStore();
		const harness = createGroupHarness();
		const first = register({ harness, plan, store });
		store.beginCompletion({
			completionId: 3,
			requiresReset: false,
			routeKey: "route-B",
		});
		harness.setSnapshotOverride(async () => [
			{ driver: first, presentation: PRESENTATION, ready: false },
		]);
		expect(await promote(store, plan)).toMatchObject({
			status: "streaming",
			reason: "not-ready",
		});

		let resolveSnapshot: ((value: readonly SmoothClipGroupSnapshot[]) => void) | null = null;
		harness.setSnapshotOverride(
			(drivers) =>
				new Promise((resolve) => {
					resolveSnapshot = () =>
						resolve(
							drivers.map((driver) => ({
								driver,
								presentation: PRESENTATION,
								ready: true,
							})),
						);
				}),
		);
		const pending = promote(store, plan);
		register({
			driver: createDriver(),
			harness,
			plan,
			registrationId: 9,
			rootId: 1,
			store,
		});
		resolveSnapshot?.([]);
		expect(await pending).toMatchObject({
			status: "streaming",
			reason: "unstable-participants",
		});
	});

	it("rejects a readiness result owned by a replaced transition", async () => {
		const { plan, store } = createStore();
		const harness = createGroupHarness();
		const driver = register({ harness, plan, store });
		store.beginCompletion({
			completionId: 33,
			requiresReset: false,
			routeKey: "route-B",
		});
		let resolveSnapshot:
			| ((value: readonly SmoothClipGroupSnapshot[]) => void)
			| undefined;
		harness.setSnapshotOverride(
			() =>
				new Promise((resolve) => {
					resolveSnapshot = resolve;
				}),
		);
		const pending = promote(store, plan);
		store.beginCompletion({
			completionId: 34,
			requiresReset: false,
			routeKey: "route-B",
		});
		resolveSnapshot?.([{ driver, presentation: PRESENTATION, ready: true }]);
		expect(await pending).toMatchObject({
			status: "streaming",
			reason: "stale",
		});
		expect(harness.animateCalls).toHaveLength(0);
	});

	it("freezes a native start that resolves after replacement", async () => {
		const { plan, store } = createStore();
		const harness = createGroupHarness();
		register({ harness, plan, store });
		store.beginCompletion({
			completionId: 35,
			requiresReset: false,
			routeKey: "route-B",
		});
		let resolveAnimation: ((groupId: number) => void) | undefined;
		harness.setAnimateOverride(
			() =>
				new Promise((resolve) => {
					resolveAnimation = resolve;
				}),
		);
		const pending = promote(store, plan);
		await Promise.resolve();
		await Promise.resolve();
		store.beginCompletion({
			completionId: 36,
			requiresReset: false,
			routeKey: "route-B",
		});
		resolveAnimation?.(777);
		expect(await pending).toMatchObject({
			status: "streaming",
			reason: "stale",
		});
		expect(harness.cancelCalls).toContainEqual({
			groupId: 777,
			behavior: "freeze",
		});
	});

	it("enforces host, capability, stability, and geometric gates", async () => {
		const { plan, store } = createStore();
		const harness = createGroupHarness();
		register({ harness, plan, store });
		store.beginCompletion({
			completionId: 4,
			requiresReset: false,
			routeKey: "route-B",
		});
		const base = {
			animation: TIMING,
			plan,
			routeKey: "route-B",
			source: "transition" as const,
			targets: [{ slotId: "content", target: TARGET }],
		};
		expect(
			await store.requestNativePromotion({
				...base,
				hostReady: false,
				stableParticipants: true,
			}),
		).toMatchObject({ reason: "host-not-ready" });
		expect(
			await store.requestNativePromotion({
				...base,
				hostReady: true,
				stableParticipants: false,
			}),
		).toMatchObject({ reason: "unstable-participants" });
		expect(
			await store.requestNativePromotion({
				...base,
				hostReady: true,
				stableParticipants: true,
				targets: [
					{ slotId: "content", target: TARGET, activeBlockers: ["rotation"] },
				],
			}),
		).toMatchObject({ reason: "geometric-blocker" });

		const unsupported = createStore(plan, {
			capabilities: () => ({
				presentationProtocolVersion: 2,
				groups: false,
				perCornerRadii: true,
				continuousCurve: true,
				contentScale: true,
				autonomousComplexPathAnimation: false,
			}),
		});
		register({ harness: createGroupHarness(), plan, store: unsupported.store });
		expect(
			await unsupported.store.requestNativePromotion({
				...base,
				hostReady: true,
				stableParticipants: true,
			}),
		).toMatchObject({ reason: "capabilities" });
	});

	it("seeds gesture release from the canonical final-UP snapshot", async () => {
		const { plan, store } = createStore();
		const harness = createGroupHarness();
		const driver = register({ harness, plan, store });
		store.beginGestureRelease({
			completionId: 5,
			requiresReset: true,
			routeKey: "route-B",
			snapshots: [
				{
					driverId: driver.__smoothClipHandle?.driverId ?? 0,
					presentation: PRESENTATION,
					ready: true,
				},
			],
		});
		expect((await promote(store, plan, "gesture-release")).status).toBe(
			"native",
		);
		expect(harness.animateCalls[0]?.entries[0]).toMatchObject({
			from: PRESENTATION,
		});
		expect(harness.animateCalls[0]?.animation).toMatchObject({
			suspensionPolicy: "finish",
		});
	});

	it("omits from on native-to-native retarget and freezes the displaced group", async () => {
		const { plan, store } = createStore();
		const harness = createGroupHarness();
		register({ harness, plan, store });
		store.beginCompletion({
			completionId: 6,
			requiresReset: false,
			routeKey: "route-B",
		});
		const first = await promote(store, plan);
		expect(first.status).toBe("native");
		const retargeted = await store.retargetNative({
			animation: TIMING,
			hostReady: true,
			plan,
			routeKey: "route-B",
			targets: [{ slotId: "content", target: PRESENTATION }],
		});
		expect(retargeted.status).toBe("native");
		expect(harness.cancelCalls).toContainEqual({
			groupId: first.groupId,
			behavior: "freeze",
		});
		expect(harness.animateCalls[1]?.entries[0]).not.toHaveProperty("from");
	});

	it("freezes relayout/portal invalidations and demotes to streaming", async () => {
		const { plan, store } = createStore();
		const harness = createGroupHarness();
		register({ harness, plan, store });
		store.beginCompletion({
			completionId: 7,
			requiresReset: false,
			routeKey: "route-B",
		});
		const promoted = await promote(store, plan);
		store.notifyPortalChanged("route-B");
		await Promise.resolve();
		expect(harness.cancelCalls).toContainEqual({
			groupId: promoted.groupId,
			behavior: "freeze",
		});
		expect(store.getSnapshot("route-B")).toMatchObject({
			state: "tracking",
			groupId: null,
		});
	});

	it("waits for reanimated, geometric reset, native snapshot, and two paints", async () => {
		const frames: (() => void)[] = [];
		const { plan, store } = createStore(createPlan(), {
			scheduleFrame: (callback) => frames.push(callback),
		});
		const harness = createGroupHarness();
		register({ harness, plan, store });
		let teardownCount = 0;
		store.beginCompletion({
			completionId: 8,
			onTeardown: () => {
				teardownCount += 1;
			},
			requiresReset: true,
			routeKey: "route-B",
		});
		const promoted = await promote(store, plan);
		store.completeReanimated(8, true);
		store.handleGroupCompletion(1, {
			groupId: promoted.groupId ?? 0,
			finished: false,
		});
		await Promise.resolve();
		await Promise.resolve();
		expect(store.getSnapshot("route-B")).toMatchObject({
			state: "tracking",
			groupId: null,
		});
		expect(teardownCount).toBe(0);
		store.completeReset(8, true);
		expect(frames).toHaveLength(1);
		frames.shift()?.();
		expect(teardownCount).toBe(0);
		frames.shift()?.();
		expect(teardownCount).toBe(1);
	});

	it("rejects stale completion ids and native callbacks after replacement", async () => {
		const frames: (() => void)[] = [];
		const { plan, store } = createStore(createPlan(), {
			scheduleFrame: (callback) => frames.push(callback),
		});
		const harness = createGroupHarness();
		register({ harness, plan, store });
		let oldTeardown = 0;
		let newTeardown = 0;
		store.beginCompletion({
			completionId: 31,
			onTeardown: () => {
				oldTeardown += 1;
			},
			requiresReset: false,
			routeKey: "route-B",
		});
		const oldPromotion = await promote(store, plan);
		store.beginCompletion({
			completionId: 32,
			onTeardown: () => {
				newTeardown += 1;
			},
			requiresReset: false,
			routeKey: "route-B",
		});
		expect(store.completeReanimated(31, true)).toBe(false);
		store.handleGroupCompletion(1, {
			groupId: oldPromotion.groupId ?? 0,
			finished: true,
		});
		expect(store.completeReanimated(32, true)).toBe(true);
		frames.shift()?.();
		frames.shift()?.();
		expect(oldTeardown).toBe(0);
		expect(newTeardown).toBe(1);
	});

	it("suppresses a deferred teardown after the transition is replaced", () => {
		const frames: (() => void)[] = [];
		const { store } = createStore(createPlan(), {
			scheduleFrame: (callback) => frames.push(callback),
		});
		let oldTeardown = 0;
		let newTeardown = 0;
		store.beginCompletion({
			completionId: 40,
			onTeardown: () => {
				oldTeardown += 1;
			},
			requiresReset: false,
			routeKey: "route-B",
		});
		expect(store.completeReanimated(40, true)).toBe(true);
		store.beginCompletion({
			completionId: 41,
			onTeardown: () => {
				newTeardown += 1;
			},
			requiresReset: false,
			routeKey: "route-B",
		});
		expect(store.completeReanimated(41, true)).toBe(true);
		while (frames.length > 0) frames.shift()?.();
		expect(oldTeardown).toBe(0);
		expect(newTeardown).toBe(1);
	});

	it("finishes active native groups on route detach/background finish", async () => {
		const { plan, store } = createStore();
		const harness = createGroupHarness();
		register({ harness, plan, store });
		store.beginCompletion({
			completionId: 9,
			requiresReset: false,
			routeKey: "route-B",
		});
		const promoted = await promote(store, plan);
		expect(store.finishRoute("route-B")).toBe(true);
		expect(harness.cancelCalls).toContainEqual({
			groupId: promoted.groupId,
			behavior: "finish",
		});
		expect(store.getSnapshot("route-B")).toMatchObject({
			state: "terminal",
			terminalReason: "finished",
		});
	});
});

describe("clip final-UP UI registry", () => {
	it("flushes every physical root for one logical active route atomically", () => {
		const first = createDriver();
		const second = createDriver();
		const batches: readonly Record<string, unknown>[][] = [];
		const makeParticipant = (driver: SmoothClipDriver, registrationId: number) => ({
			base: PRESENTATION,
			driver,
			registrationId,
			slotsMap: createMutable({ content: { clip: TARGET } }),
			styleId: "content",
		});
		registerClipStreamRootOnUI({
			participants: createMutable([makeParticipant(first, 1)]),
			rootId: 8001,
			routeKey: "route-B",
			setBatch: (entries) => batches.push(entries),
		});
		registerClipStreamRootOnUI({
			participants: createMutable([makeParticipant(second, 2)]),
			rootId: 8002,
			routeKey: "route-B",
			setBatch: () => {
				throw new Error("Only the deterministic first root owns the batch");
			},
		});
		const snapshots = flushClipStreamRouteOnUI("route-B");
		expect(snapshots).toHaveLength(2);
		expect(batches[0]).toHaveLength(2);
		expect(snapshots[0]?.presentation).toEqual(TARGET);
		unregisterClipStreamRootOnUI(8001);
		unregisterClipStreamRootOnUI(8002);
	});

	it("preserves legacy geometric projection during the final-UP flush", () => {
		const driver = createDriver();
		let presentation: CanonicalSmoothClipPresentation | undefined;
		registerClipStreamRootOnUI({
			participants: createMutable([
				{
					base: PRESENTATION,
					driver,
					footprint: { height: 200, width: 300 },
					projection: "legacy" as const,
					registrationId: 1,
					slotsMap: createMutable({
						mask: {
							style: {
								bottom: "10%",
								height: "50%",
								right: 30,
								width: "40%",
							},
						},
					}),
					styleId: "mask",
				},
			]),
			rootId: 8050,
			routeKey: "route-legacy",
			setBatch: (entries) => {
				presentation = entries[0]?.presentation;
			},
		});
		flushClipStreamRouteOnUI("route-legacy");
		expect(presentation?.clip).toMatchObject({
			height: 100,
			width: 120,
			x: 150,
			y: 80,
		});
		unregisterClipStreamRootOnUI(8050);
	});

	it("batches pan and pinch update frames directly and resamples final UP", () => {
		const driver = createDriver();
		const panGestures = {
			x: createMutable(0),
			y: createMutable(0),
			normX: createMutable(0),
			normY: createMutable(0),
			velocity: createMutable(0),
			raw: {
				x: createMutable(0),
				y: createMutable(0),
				normX: createMutable(0),
				normY: createMutable(0),
			},
			internal: {
				progressDeltaX: createMutable(0),
				progressDeltaY: createMutable(0),
			},
		};
		const pinchGestures = {
			scale: createMutable(1),
			normScale: createMutable(0),
			raw: {
				scale: createMutable(1),
				normScale: createMutable(0),
			},
			active: createMutable<string | null>(null),
		};
		const projected: string[] = [];
		let expectedPanX = 30;
		registerClipStreamRootOnUI({
			participants: createMutable([
				{
					base: PRESENTATION,
					driver,
					registrationId: 1,
					slotsMap: {
						get: () => {
							expect(panGestures.x.get()).toBe(expectedPanX);
							projected.push(`pan:${expectedPanX}`);
							return { content: { clip: TARGET } };
						},
					} as SharedValue<Record<string, unknown>>,
					styleId: "content",
				},
			]),
			rootId: 8101,
			routeKey: "route-pan",
			setBatch: () => {},
		});
		trackPanGestureAndFlush(
			{ translationX: 30, translationY: 20, velocityX: 50, velocityY: 25 } as any,
			{ translationX: 30, translationY: 20, velocityX: 50, velocityY: 25 } as any,
			panGestures as any,
			{ width: 300, height: 400 },
			"route-pan",
		);
		expectedPanX = 60;
		sampleFinalPanGestureAndFlush(
			{ translationX: 60, translationY: 40, velocityX: 100, velocityY: 50 } as any,
			{ translationX: 60, translationY: 40, velocityX: 100, velocityY: 50 } as any,
			panGestures as any,
			{ width: 300, height: 400 },
			"route-pan",
		);
		unregisterClipStreamRootOnUI(8101);

		let expectedPinchScale = 0.85;
		registerClipStreamRootOnUI({
			participants: createMutable([
				{
					base: PRESENTATION,
					driver,
					registrationId: 2,
					slotsMap: {
						get: () => {
							expect(pinchGestures.scale.get()).toBe(expectedPinchScale);
							projected.push(`pinch:${expectedPinchScale}`);
							return { content: { clip: TARGET } };
						},
					} as SharedValue<Record<string, unknown>>,
					styleId: "content",
				},
			]),
			rootId: 8102,
			routeKey: "route-pinch",
			setBatch: () => {},
		});
		trackPinchGestureAndFlush(
			{ scale: 0.85 } as any,
			{ scale: 0.85 } as any,
			pinchGestures as any,
			"route-pinch",
		);
		expectedPinchScale = 0.7;
		sampleFinalPinchGestureAndFlush(
			{ scale: 0.7 } as any,
			{ scale: 0.7 } as any,
			pinchGestures as any,
			"route-pinch",
		);
		unregisterClipStreamRootOnUI(8102);
		expect(projected).toEqual([
			"pan:30",
			"pan:60",
			"pinch:0.85",
			"pinch:0.7",
		]);
	});
});
