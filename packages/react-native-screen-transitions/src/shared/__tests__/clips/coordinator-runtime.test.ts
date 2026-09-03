import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import {
	type CanonicalSmoothClipPresentation,
	canonicalizeClipPresentation,
	type SmoothClipGroup,
	type SmoothClipGroupSnapshot,
	type SmoothClipRef,
	type SmoothClipRunHandle,
} from "react-native-smooth-clip-view";
import { DefaultSpec } from "../../configs/specs";
import {
	flushClipStreamRouteOnUI,
	registerClipStreamRootOnUI,
	scheduleClipStreamRouteFlushOnUI,
	unregisterClipStreamRootOnUI,
} from "../../providers/screen/clip/clip-stream-ui";
import {
	SmoothClipLeaseRegistry,
} from "../../providers/screen/clips/coordinator";
import { resolveSmoothClipNativeAnimation } from "../../providers/screen/clips/coordinator/native-animation";
import { SmoothClipCoordinatorRuntimeStore } from "../../providers/screen/clips/coordinator/runtime-store";
import {
	trackPanGesture,
	trackPanGestureAndFlush,
} from "../../providers/screen/gestures/pan/behavior/pan-lifecycle";
import {
	trackPinchGesture,
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

const readyByDriver = new WeakMap<object, boolean>();

const createDriver = (ready = true): SmoothClipRef => {
	const driver = { testId: nextDriverId++ } as unknown as SmoothClipRef;
	readyByDriver.set(driver, ready);
	return driver;
};

type GroupHarness = ReturnType<typeof createGroupHarness>;

const createGroupHarness = () => {
	let snapshotOverride:
		| ((drivers: readonly SmoothClipRef[]) => readonly SmoothClipGroupSnapshot[])
		| null = null;
	const animateCalls: { entries: readonly Record<string, unknown>[]; animation: Record<string, unknown> }[] = [];
	const cancelCalls: SmoothClipRunHandle[] = [];
	const setBatchCalls: readonly Record<string, unknown>[][] = [];
	const completionTags: number[] = [];
	const snapshots = (drivers: readonly SmoothClipRef[]) =>
		drivers.map((clip) => ({
			clip,
			frame: PRESENTATION,
			ready: readyByDriver.get(clip) ?? false,
		}));
	const driver = {
		ui: {
			beginInteraction: (drivers: readonly SmoothClipRef[]) =>
				snapshotOverride ? snapshotOverride(drivers) : snapshots(drivers),
			setFrames: (entries: readonly Record<string, unknown>[]) => {
				setBatchCalls.push(entries);
			},
			animateTo: (
				entries: readonly Record<string, unknown>[],
				animation: Record<string, unknown>,
				completionTag = 0,
			) => {
				animateCalls.push({ entries, animation });
				completionTags.push(completionTag);
				return { testRunId: completionTags.length } as unknown as SmoothClipRunHandle;
			},
			cancel: (handle: SmoothClipRunHandle) => {
				cancelCalls.push(handle);
				return [];
			},
		},
		react: {},
	} as unknown as SmoothClipGroup;
	return {
		animateCalls,
		cancelCalls,
		driver,
		setBatchCalls,
		finishRun: (index: number, finished: boolean) => ({
			completionTag: completionTags[index],
			finished,
		}),
		setSnapshotOverride: (override: typeof snapshotOverride) => {
			snapshotOverride = override;
		},
	};
};

const createPlan = () =>
	defineBuiltInClipNativePlan({
		id: "zoom",
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
	driver?: SmoothClipRef;
	harness: GroupHarness;
	kind?: "screen" | "float-overlay";
	plan?: ReturnType<typeof createPlan>;
	registrationId?: number;
	rootId?: number;
	routeKey?: string;
	store: SmoothClipCoordinatorRuntimeStore;
}) => {
	store.registerRoot({ group: harness.driver, kind, rootId, routeKey });
	store.registerParticipant({
		clip: driver,
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
	it("keeps native promotion disabled by default", async () => {
		const plan = createPlan();
		const store = new SmoothClipCoordinatorRuntimeStore({ trustedPlans: [plan] });
		expect(store.isEnabled()).toBe(false);
		expect(await promote(store, plan)).toMatchObject({ reason: "disabled" });
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
			endpointClips: { "0": PRESENTATION, "1": TARGET },
			legacyStyle: {},
			projectedClip: TARGET,
		}) as { clip?: typeof TARGET };
		expect(getBuiltInClipRuntimeMarker(zoom.clip)).toMatchObject({
			planId: "zoom",
			slotId: "content",
		});
		expect(getBuiltInClipRuntimeMarker(reveal.clip)).toMatchObject({
			endpoints: { "0": PRESENTATION, "1": TARGET },
			planId: "reveal",
			slotId: "content",
		});
		expect(getBuiltInClipRuntimeMarker(TARGET)).toBeNull();
	});

	it("promotes from endpoint metadata that arrives on the next frame", async () => {
		const scheduled: Array<() => void> = [];
		const { plan, store } = createStore(createPlan(), {
			scheduleFrame: (callback) => scheduled.push(callback),
		});
		const harness = createGroupHarness();
		register({ harness, plan, rootId: 91, routeKey: "route-race", store });
		store.beginCompletion({
			completionId: 91,
			requiresReset: false,
			routeKey: "route-race",
		});

		const pending = store.requestRecordedBuiltInPromotion({
			animation: TIMING,
			routeKey: "route-race",
			source: "transition",
			targetProgress: 1,
		});
		expect(scheduled).toHaveLength(1);
		store.recordBuiltInFrame(91, "route-race", {
			hostReady: true,
			participantFingerprint: "stable-race-host",
			planId: plan.id,
			progress: 0.2,
			targets: [
				{
					endpoints: { "0": PRESENTATION, "1": TARGET },
					slotId: "content",
					target: PRESENTATION,
				},
			],
		});
		scheduled.shift()?.();

		expect(await pending).toMatchObject({
			reason: "promoted",
			status: "native",
		});
		expect(harness.animateCalls[0]?.entries).toMatchObject([
			{ target: TARGET },
		]);
	});

	it("maps only compatible lifecycle motion into native animations", () => {
		expect(
			resolveSmoothClipNativeAnimation({
				damping: 500,
				energyThreshold: 1e-8,
				mass: 3,
				reduceMotion: "always",
				stiffness: 1000,
				velocity: 2,
			}),
		).toEqual({
			type: "spring",
			damping: 500,
			energyThreshold: 1e-8,
			mass: 3,
			reduceMotion: "always",
			stiffness: 1000,
			velocity: 2,
		});
		expect(resolveSmoothClipNativeAnimation(DefaultSpec)).toBeNull();
		expect(
			resolveSmoothClipNativeAnimation({ duration: 240 }),
		).toEqual({
			type: "timing",
			duration: 240,
			controlPoints: [0.25, 0.1, 0.25, 1],
		});
		expect(
			resolveSmoothClipNativeAnimation(
				{ duration: 200, easing: () => 0.5 },
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
				group: harness.driver,
				kind: "screen",
				rootId: 91,
				routeKey: "route-built-in",
			});
			const streamingSuspensions: SharedValue<number>[] = [];
			for (const [index, participant] of plan.participants.entries()) {
				const streamingSuspended = createMutable(0);
				streamingSuspensions.push(streamingSuspended);
				store.registerParticipant({
					clip: createDriver(),
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
			store.handleNativeCompletion(91, harness.finishRun(0, true));
			expect(streamingSuspensions.every((value) => value.get() === 1)).toBe(
				true,
			);
			store.completeReanimated(90, true);
			expect(streamingSuspensions.every((value) => value.get() === 0)).toBe(
				true,
			);
		},
	);

	it("promotes reveal when its optional navigation-mask host is absent", async () => {
		const plan = REVEAL_CLIP_NATIVE_PLAN;
		const harness = createGroupHarness();
		const store = new SmoothClipCoordinatorRuntimeStore({
			leaseRegistry: new SmoothClipLeaseRegistry(),
			promotionEnabled: true,
			storeId: "built-in-reveal-content-only",
			trustedPlans: [plan],
		});
		store.registerRoot({
			group: harness.driver,
			kind: "screen",
			rootId: 92,
			routeKey: "route-reveal-content-only",
		});
		store.registerParticipant({
			clip: createDriver(),
			registrationId: 1,
			rootId: 92,
			slotId: "content",
			streamingSuspended: createMutable(0),
			trustedPlans: [plan],
		});
		store.recordBuiltInFrame(92, "route-reveal-content-only", {
			hostReady: true,
			participantFingerprint: "stable-reveal-content-host",
			planId: plan.id,
			progress: 0,
			targets: [{ slotId: "content", target: PRESENTATION }],
		});
		store.recordBuiltInFrame(92, "route-reveal-content-only", {
			hostReady: true,
			participantFingerprint: "stable-reveal-content-host",
			planId: plan.id,
			progress: 1,
			targets: [{ slotId: "content", target: TARGET }],
		});
		store.beginCompletion({
			completionId: 92,
			requiresReset: false,
			routeKey: "route-reveal-content-only",
		});

		expect(
			await store.requestRecordedBuiltInPromotion({
				animation: TIMING,
				routeKey: "route-reveal-content-only",
				source: "transition",
				targetProgress: 1,
			}),
		).toMatchObject({ reason: "promoted", status: "native" });
		expect(harness.animateCalls[0]?.entries).toHaveLength(1);
	});

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
		harness.setSnapshotOverride(() => [
			{ clip: first, frame: PRESENTATION, ready: false },
		]);
		expect(await promote(store, plan)).toMatchObject({
			status: "streaming",
			reason: "not-ready",
		});

		harness.setSnapshotOverride((drivers) => {
			register({
				driver: createDriver(),
				harness,
				plan,
				registrationId: 9,
				rootId: 1,
				store,
			});
			return drivers.map((clip) => ({
				clip,
				frame: PRESENTATION,
				ready: true,
			}));
		});
		expect(await promote(store, plan)).toMatchObject({
			status: "streaming",
			reason: "stale",
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
		harness.setSnapshotOverride(() => {
			store.beginCompletion({
				completionId: 34,
				requiresReset: false,
				routeKey: "route-B",
			});
			return [{ clip: driver, frame: PRESENTATION, ready: true }];
		});
		expect(await promote(store, plan)).toMatchObject({
			status: "streaming",
			reason: "stale",
		});
		expect(harness.animateCalls).toHaveLength(1);
		expect(harness.cancelCalls).toHaveLength(1);
	});

	it("enforces host, stability, and geometric gates", async () => {
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
	});

	it("seeds gesture release from the canonical final-UP snapshot", async () => {
		const { plan, store } = createStore();
		const harness = createGroupHarness();
		register({ harness, plan, store });
		store.beginGestureRelease({
			completionId: 5,
			requiresReset: true,
			routeKey: "route-B",
			snapshots: [
				{
					driverId: 1,
					presentation: PRESENTATION,
					ready: true,
				},
			],
		});
		expect((await promote(store, plan, "gesture-release")).status).toBe(
			"native",
		);
		expect(harness.setBatchCalls[0]?.[0]).toMatchObject({ frame: PRESENTATION });
		expect(harness.animateCalls[0]?.entries[0]).not.toHaveProperty("from");
		expect(harness.animateCalls[0]?.animation).toEqual(TIMING);
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
		expect(harness.cancelCalls).toHaveLength(1);
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
		await promote(store, plan);
		store.notifyPortalChanged("route-B");
		await Promise.resolve();
		expect(harness.cancelCalls).toHaveLength(1);
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
		store.handleNativeCompletion(1, {
			completionTag: promoted.groupId ?? 0,
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
		await promote(store, plan);
		store.beginCompletion({
			completionId: 32,
			onTeardown: () => {
				newTeardown += 1;
			},
			requiresReset: false,
			routeKey: "route-B",
		});
		expect(store.completeReanimated(31, true)).toBe(false);
		store.handleNativeCompletion(1, harness.finishRun(0, true));
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
		await promote(store, plan);
		expect(store.finishRoute("route-B")).toBe(true);
		expect(harness.cancelCalls).toHaveLength(1);
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
		const makeParticipant = (driver: SmoothClipRef, registrationId: number) => ({
			base: PRESENTATION,
			clip: driver,
			registrationId,
			slotsMap: createMutable({ content: { clip: TARGET } }),
			styleId: "content",
		});
		registerClipStreamRootOnUI({
			participants: createMutable([makeParticipant(first, 1)]),
			rootId: 8001,
			routeKey: "route-B",
			setFrames: (entries) => batches.push(entries),
		});
		registerClipStreamRootOnUI({
			participants: createMutable([makeParticipant(second, 2)]),
			rootId: 8002,
			routeKey: "route-B",
			setFrames: () => {
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
					clip: driver,
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
			setFrames: (entries) => {
				presentation = entries[0]?.frame;
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

	it("batches pan and pinch after mapper projection and resamples final UP", async () => {
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
		let resolvedPanX = 0;
		let finalPanX: number | undefined;
		registerClipStreamRootOnUI({
			participants: createMutable([
				{
					base: PRESENTATION,
					clip: driver,
					registrationId: 1,
					slotsMap: {
						get: () => {
							projected.push(`pan:${resolvedPanX}`);
							return {
								content: {
									clip: {
										...TARGET,
										clip: { ...TARGET.clip, x: resolvedPanX },
									},
								},
							};
						},
					} as SharedValue<Record<string, unknown>>,
					styleId: "content",
				},
			]),
			rootId: 8101,
			routeKey: "route-pan",
			setFrames: () => {},
		});
		trackPanGestureAndFlush(
			{ translationX: 30, translationY: 20, velocityX: 50, velocityY: 25 } as any,
			{ translationX: 30, translationY: 20, velocityX: 50, velocityY: 25 } as any,
			panGestures as any,
			{ width: 300, height: 400 },
			"route-pan",
		);
		resolvedPanX = panGestures.x.get();
		await Promise.resolve();
		trackPanGesture(
			{ translationX: 60, translationY: 40, velocityX: 100, velocityY: 50 } as any,
			{ translationX: 60, translationY: 40, velocityX: 100, velocityY: 50 } as any,
			panGestures as any,
			{ width: 300, height: 400 },
		);
		scheduleClipStreamRouteFlushOnUI(
			"route-pan",
			(snapshots) => {
				finalPanX = snapshots[0]?.presentation.clip.x;
			},
		);
		resolvedPanX = panGestures.x.get();
		await Promise.resolve();
		unregisterClipStreamRootOnUI(8101);

		let resolvedPinchScale = 1;
		let finalPinchScale: number | undefined;
		registerClipStreamRootOnUI({
			participants: createMutable([
				{
					base: PRESENTATION,
					clip: driver,
					registrationId: 2,
					slotsMap: {
						get: () => {
							projected.push(`pinch:${resolvedPinchScale}`);
							return {
								content: {
									clip: {
										...TARGET,
										contentScale: resolvedPinchScale,
									},
								},
							};
						},
					} as SharedValue<Record<string, unknown>>,
					styleId: "content",
				},
			]),
			rootId: 8102,
			routeKey: "route-pinch",
			setFrames: () => {},
		});
		trackPinchGestureAndFlush(
			{ scale: 0.85 } as any,
			{ scale: 0.85 } as any,
			pinchGestures as any,
			"route-pinch",
		);
		resolvedPinchScale = pinchGestures.scale.get();
		await Promise.resolve();
		trackPinchGesture(
			{ scale: 0.7 } as any,
			{ scale: 0.7 } as any,
			pinchGestures as any,
		);
		scheduleClipStreamRouteFlushOnUI(
			"route-pinch",
			(snapshots) => {
				finalPinchScale = snapshots[0]?.presentation.contentScale;
			},
		);
		resolvedPinchScale = pinchGestures.scale.get();
		await Promise.resolve();
		unregisterClipStreamRootOnUI(8102);
		expect(projected).toEqual([
			"pan:30",
			"pan:60",
			"pinch:0.85",
			"pinch:0.7",
		]);
		expect(finalPanX).toBe(60);
		expect(finalPinchScale).toBe(0.7);
	});
});
