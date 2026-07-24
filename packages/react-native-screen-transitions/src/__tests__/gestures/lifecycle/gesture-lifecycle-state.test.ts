import { afterEach, describe, expect, it } from "bun:test";
import React from "react";
import { act, create } from "react-test-renderer";
import type { SharedValue } from "react-native-reanimated";
import {
	createScreenTransitionState,
	DEFAULT_SCREEN_TRANSITION_OPTIONS,
} from "../../../constants";
import { hydrateTransitionState } from "../../../providers/screen/animation/helpers/hydrate-transition-state";
import type { BuiltState } from "../../../providers/screen/animation/helpers/hydrate-transition-state/types";
import {
	finalizePanRelease,
	startPanBase,
	trackPanGesture,
} from "../../../providers/screen/gestures/pan/behavior/pan-lifecycle";
import type { GestureCompositionOwner } from "../../../providers/screen/gestures/types";
import {
	finalizePinchRelease,
	startPinchBase,
} from "../../../providers/screen/gestures/pinch/behavior/pinch-lifecycle";
import {
	updateAbsolutePinchFocalPoint,
	updatePinchRotation,
} from "../../../providers/screen/gestures/pinch/activation/use-pinch-activation";
import { useTransitionStartController } from "../../../components/screen-lifecycle/hooks/use-transition-start-controller";
import type { AnimationStoreMap } from "../../../stores/animation.store";
import { AnimationStore } from "../../../stores/animation.store";
import type { GestureStoreMap } from "../../../stores/gesture.store";
import { GestureStore } from "../../../stores/gesture.store";
import {
	LifecycleTransitionRequestKind,
	SystemStore,
} from "../../../stores/system.store";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";

const originalRequestAnimationFrame = globalThis.requestAnimationFrame;

const shared = <T>(initialValue: T): SharedValue<T> => {
	let value = initialValue;
	return {
		get: () => value,
		set: (nextValue: T) => {
			value = nextValue;
		},
		value,
	} as SharedValue<T>;
};

const createGestureSnapshotStore = () => ({
	x: shared(0),
	y: shared(0),
	normX: shared(0),
	normY: shared(0),
	velocity: shared(0),
	scale: shared(1),
	normScale: shared(0),
	focalX: shared(0),
	focalY: shared(0),
	pinchOriginX: shared(0),
	pinchOriginY: shared(0),
	rotation: shared(0),
	raw: {
		x: shared(0),
		y: shared(0),
		normX: shared(0),
		normY: shared(0),
		scale: shared(1),
		normScale: shared(0),
		rotation: shared(0),
	},
	active: shared(null),
	direction: shared(null),
});

const createGestureStore = (): GestureStoreMap => {
	const normX = shared(0);
	const normY = shared(0);
	const dismissing = shared(0);
	const dragging = shared(0);

	return {
		x: shared(0),
		y: shared(0),
		normX,
		normY,
		velocity: shared(0),
		scale: shared(1),
		normScale: shared(0),
		focalX: shared(0),
		focalY: shared(0),
		pinchOriginX: shared(0),
		pinchOriginY: shared(0),
		rotation: shared(0),
		raw: {
			x: shared(0),
			y: shared(0),
			normX: shared(0),
			normY: shared(0),
			scale: shared(1),
			normScale: shared(0),
			rotation: shared(0),
		},
		internal: {
			progressBaseline: shared(0),
			progressDeltaX: shared(0),
			progressDeltaY: shared(0),
			lockedSnapPoint: shared(null),
			snapshot: createGestureSnapshotStore(),
		},
		dismissing,
		dragging,
		settling: shared(0),
		active: shared(null),
		direction: shared(null),
		normalizedX: normX,
		normalizedY: normY,
		isDismissing: dismissing,
		isDragging: dragging,
	};
};

const createAnimations = (): AnimationStoreMap => ({
	transitionProgress: shared(1),
	visualProgress: shared(1),
	stackProgress: shared(1),
	willAnimate: shared(0),
	progressAnimating: shared(0),
	progressSettled: shared(1),
	closing: shared(0),
	entering: shared(0),
});

const createRuntime = (
	policyOverrides: Partial<{
		gestureReleaseVelocityScale: number;
	}> = {},
) => {
	const gestures = createGestureStore();
	const animations = createAnimations();
	const runtime = {
		participation: { canDismiss: true, effectiveSnapPoints: {} },
		policy: {
			gestureReleaseVelocityScale: 1,
			...policyOverrides,
		},
		stores: {
			gestures,
			animations,
			system: {
				targetProgress: shared(1),
				animationProgress: shared(0),
			},
		},
		};

	return { runtime: runtime as any, gestures, animations };
};

let storedRuntimeId = 0;

const createStoredRuntime = () => {
	const routeKey = `gesture-lifecycle-${storedRuntimeId++}`;
	const animations = AnimationStore.getBag(routeKey);
	const gestures = GestureStore.getBag(routeKey);
	const system = SystemStore.getBag(routeKey);
	const runtime = {
		participation: { canDismiss: true, effectiveSnapPoints: {} },
		policy: { gestureReleaseVelocityScale: 1 },
		stores: { gestures, animations, system },
	};

	return {
		runtime: runtime as any,
		gestures,
		animations,
		clear: () => {
			AnimationStore.clearBag(routeKey);
			GestureStore.clearBag(routeKey);
			SystemStore.clearBag(routeKey);
		},
	};
};

const exposeToInterpolator = ({
	runtime,
	gestures,
	animations,
}: ReturnType<typeof createRuntime>, sortedNumericSnapPoints: number[] = []) => {
	let observed: ReturnType<typeof hydrateTransitionState> | undefined;
	const screenStyleInterpolator = ({ current }: { current: typeof observed }) => {
		observed = current;
		return null;
	};
	const state: BuiltState = {
		transitionProgress: animations.transitionProgress,
		visualProgress: animations.visualProgress,
		stackProgress: animations.stackProgress,
		willAnimate: animations.willAnimate,
		closing: animations.closing,
		progressAnimating: animations.progressAnimating,
		progressSettled: animations.progressSettled,
		entering: animations.entering,
		gesture: gestures,
		route: { key: "details", name: "Details" },
		options: DEFAULT_SCREEN_TRANSITION_OPTIONS,
		optionsSlot: {},
		targetProgress: runtime.stores.system.targetProgress,
		resolvedAutoSnapPoint: shared(-1),
		measuredContentLayout: shared(null),
		scrollMetadata: shared(null),
		contentLayoutSlot: { width: 0, height: 0 },
		hasAutoSnapPoint: false,
		sortedNumericSnapPoints,
		unwrapped: createScreenTransitionState(
			{ key: "details", name: "Details" },
			undefined,
			DEFAULT_SCREEN_TRANSITION_OPTIONS,
		),
	};

	screenStyleInterpolator({
		current: hydrateTransitionState(state, { width: 390, height: 844 }),
	});

	return observed;
};

const restoreRequestAnimationFrame = (
	value: typeof requestAnimationFrame | undefined,
) => {
	if (value) {
		globalThis.requestAnimationFrame = value;
		return;
	}

	Reflect.deleteProperty(globalThis, "requestAnimationFrame");
};

const installDeferredAnimationFrame = () => {
	const original = globalThis.requestAnimationFrame;
	const queue: FrameRequestCallback[] = [];

	globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
		queue.push(callback);
		return queue.length;
	}) as typeof requestAnimationFrame;

	return {
		flush: () => {
			while (queue.length > 0) {
				queue.shift()?.(0);
			}
		},
		restore: () => {
			restoreRequestAnimationFrame(original);
		},
	};
};

afterEach(() => {
	restoreRequestAnimationFrame(originalRequestAnimationFrame);
});

describe("gesture lifecycle state", () => {
	it("does not pulse willAnimate when an entering screen starts its initial open", () => {
		const raf = installDeferredAnimationFrame();
		const animations = createAnimations();
		const system = SystemStore.getBag("initial-open-contract");
		animations.entering.set(1);
		system.actions.requestLifecycleTransition(
			LifecycleTransitionRequestKind.Open,
			1,
		);

		const Harness = () => {
			useTransitionStartController({
				current: {
					route: { key: "initial-open-contract" },
					options: {},
				} as any,
				animations,
				system,
			});
			return null;
		};

		act(() => {
			create(React.createElement(Harness));
		});

		expect(animations.willAnimate.get()).toBe(0);
		raf.restore();
	});

	it("marks opening as entering before the willAnimate pulse is observed", () => {
		const raf = installDeferredAnimationFrame();
		const animations = createAnimations();
		const animationProgress = shared(0);
		animations.transitionProgress.set(0);

		animateToProgress({
			target: "open",
			animations,
			targetProgress: shared(0),
			animationProgress,
		});

		expect(animations.willAnimate.get()).toBe(1);
		expect(animations.entering.get()).toBe(1);
		expect(animations.closing.get()).toBe(0);
		expect(animationProgress.get()).toBe(0);

		raf.flush();
		raf.restore();

		expect(animationProgress.get()).toBe(1);
	});

	it("marks closing before the willAnimate pulse is observed", () => {
		const raf = installDeferredAnimationFrame();
		const animations = createAnimations();
		const animationProgress = shared(1);
		animations.entering.set(1);

		animateToProgress({
			target: "close",
			animations,
			targetProgress: shared(1),
			animationProgress,
		});

		expect(animations.willAnimate.get()).toBe(1);
		expect(animations.closing.get()).toBe(1);
		expect(animations.entering.get()).toBe(0);
		expect(animationProgress.get()).toBe(1);

		raf.flush();
		raf.restore();

		expect(animationProgress.get()).toBe(0);
	});

	it("exposes a committed programmatic close at its motion-start pulse", () => {
		const raf = installDeferredAnimationFrame();
		const { runtime, gestures, animations } = createRuntime();

		animateToProgress({
			target: "close",
			spec: { close: { duration: 200, __defer: true } as any },
			animations,
			targetProgress: runtime.stores.system.targetProgress,
			animationProgress: runtime.stores.system.animationProgress,
		});

		expect(exposeToInterpolator({ runtime, gestures, animations })).toMatchObject({
			willAnimate: 1,
			closing: 1,
			animating: 0,
		});

		raf.flush();
		raf.restore();

		expect(exposeToInterpolator({ runtime, gestures, animations })).toMatchObject({
			closing: 1,
			willAnimate: 0,
			animating: 1,
		});
	});

	it("treats the first snap-point entrance as entering until it settles at the fallback", () => {
		const raf = installDeferredAnimationFrame();
		const state = createRuntime();
		state.animations.transitionProgress.set(0);
		state.animations.visualProgress.set(0);
		state.animations.stackProgress.set(0);
		state.animations.entering.set(1);
		state.animations.progressSettled.set(0);

		animateToProgress({
			target: 0.25,
			animations: state.animations,
			targetProgress: state.runtime.stores.system.targetProgress,
			animationProgress: state.runtime.stores.system.animationProgress,
		});

		expect(exposeToInterpolator(state, [0.25, 1])).toMatchObject({
			progress: 0,
			entering: 1,
		});

		raf.flush();
		raf.restore();

		expect(exposeToInterpolator(state, [0.25, 1])).toMatchObject({
			progress: 0.25,
			entering: 0,
			snapIndex: 0,
		});
	});

	it("does not re-enter when expanding from the fallback snap point", () => {
		const raf = installDeferredAnimationFrame();
		const state = createRuntime();
		state.animations.transitionProgress.set(0.25);
		state.animations.visualProgress.set(0.25);
		state.animations.stackProgress.set(0.25);
		state.runtime.stores.system.targetProgress.set(0.25);

		animateToProgress({
			target: 1,
			markEntering: false,
			animations: state.animations,
			targetProgress: state.runtime.stores.system.targetProgress,
			animationProgress: state.runtime.stores.system.animationProgress,
		});

		expect(exposeToInterpolator(state, [0.25, 1])).toMatchObject({
			entering: 0,
		});

		raf.flush();
		raf.restore();
	});

	it("does not close when collapsing between nonzero snap points", () => {
		const raf = installDeferredAnimationFrame();
		const state = createRuntime();
		state.animations.transitionProgress.set(1);
		state.animations.visualProgress.set(1);
		state.animations.stackProgress.set(1);
		state.runtime.stores.system.targetProgress.set(1);

		animateToProgress({
			target: 0.25,
			animations: state.animations,
			targetProgress: state.runtime.stores.system.targetProgress,
			animationProgress: state.runtime.stores.system.animationProgress,
		});

		expect(exposeToInterpolator(state, [0.25, 1])).toMatchObject({
			closing: 0,
		});

		raf.flush();
		raf.restore();
	});

	it("clears a stale closing flag when a retained screen reopens", () => {
		const raf = installDeferredAnimationFrame();
		const animations = createAnimations();

		animations.closing.set(1);

		animateToProgress({
			target: "open",
			animations,
			targetProgress: shared(0),
			animationProgress: shared(0),
		});

		expect(animations.closing.get()).toBe(0);
		expect(animations.entering.get()).toBe(1);

		raf.flush();
		raf.restore();
	});

	it("emits willAnimate when a pan starts from idle state", () => {
		const raf = installDeferredAnimationFrame();
		const { runtime, gestures, animations } = createRuntime();

		startPanBase(runtime);

		expect(gestures.dragging.get()).toBe(1);
		expect(gestures.settling.get()).toBe(0);
		expect(animations.willAnimate.get()).toBe(1);

		raf.flush();
		raf.restore();

		expect(animations.willAnimate.get()).toBe(0);
	});

	it("exposes an accepted idle pan with its public initiator and one pulse", () => {
		const raf = installDeferredAnimationFrame();
		const { runtime, gestures, animations } = createRuntime();
		gestures.active.set("vertical");

		startPanBase(runtime);

		expect(exposeToInterpolator({ runtime, gestures, animations })).toMatchObject({
			willAnimate: 1,
			animating: 0,
			gesture: { dragging: 1, initiator: "vertical" },
		});

		raf.flush();
		raf.restore();

		expect(exposeToInterpolator({ runtime, gestures, animations })).toMatchObject({
			willAnimate: 0,
			animating: 1,
		});
	});

	it("does not emit willAnimate when a pan restarts while gesture values are settling", () => {
		const raf = installDeferredAnimationFrame();
		const { runtime, gestures, animations } = createRuntime();
		gestures.settling.set(1);
		gestures.normY.set(0.25);
		animations.progressAnimating.set(1);

		startPanBase(runtime);

		expect(gestures.dragging.get()).toBe(1);
		expect(gestures.settling.get()).toBe(0);
		expect(animations.willAnimate.get()).toBe(0);

		raf.flush();
		raf.restore();
	});

	it("does not emit a second public pulse when re-grabbing during reset", () => {
		const raf = installDeferredAnimationFrame();
		const { runtime, gestures, animations } = createRuntime();
		gestures.settling.set(1);
		gestures.normY.set(0.25);
		animations.progressAnimating.set(1);

		startPanBase(runtime);

		expect(exposeToInterpolator({ runtime, gestures, animations })).toMatchObject({
			willAnimate: 0,
			gesture: { dragging: 1 },
		});

		raf.flush();
		raf.restore();
	});

	it("emits willAnimate when a pan restarts after gesture values reached rest", () => {
		const raf = installDeferredAnimationFrame();
		const { runtime, gestures, animations } = createRuntime();
		gestures.settling.set(1);
		gestures.normY.set(0);

		startPanBase(runtime);

		expect(gestures.dragging.get()).toBe(1);
		expect(gestures.settling.get()).toBe(0);
		expect(animations.willAnimate.get()).toBe(1);

		raf.flush();
		raf.restore();

		expect(animations.willAnimate.get()).toBe(0);
	});

	it("clears stale pinch-only state when a pan starts", () => {
		const { runtime, gestures, animations } = createRuntime();
		gestures.settling.set(1);
		animations.progressAnimating.set(1);
		gestures.scale.set(0.72);
		gestures.normScale.set(-0.28);
		gestures.focalX.set(240);
		gestures.focalY.set(520);
		gestures.pinchOriginX.set(210);
		gestures.pinchOriginY.set(480);
		gestures.rotation.set(0.35);
		gestures.raw.scale.set(0.68);
		gestures.raw.normScale.set(-0.32);
		gestures.raw.rotation.set(0.42);

		startPanBase(runtime);

		expect(gestures.scale.get()).toBe(1);
		expect(gestures.normScale.get()).toBe(0);
		expect(gestures.focalX.get()).toBe(0);
		expect(gestures.focalY.get()).toBe(0);
		expect(gestures.pinchOriginX.get()).toBe(0);
		expect(gestures.pinchOriginY.get()).toBe(0);
		expect(gestures.rotation.get()).toBe(0);
		expect(gestures.raw.scale.get()).toBe(1);
		expect(gestures.raw.normScale.get()).toBe(0);
		expect(gestures.raw.rotation.get()).toBe(0);
	});

	it("does not emit willAnimate when a pinch restarts while gesture values are settling", () => {
		const raf = installDeferredAnimationFrame();
		const { runtime, gestures, animations } = createRuntime();
		gestures.settling.set(1);
		gestures.normScale.set(0.25);
		animations.progressAnimating.set(1);

		startPinchBase(runtime);

		expect(gestures.dragging.get()).toBe(1);
		expect(gestures.settling.get()).toBe(0);
		expect(animations.willAnimate.get()).toBe(0);

		raf.flush();
		raf.restore();
	});

	it("keeps the absolute pinch origin stable while the focal point moves", () => {
		const gestures = createGestureStore();

		updateAbsolutePinchFocalPoint(
			{
				allTouches: [
					{ absoluteX: 100, absoluteY: 220 },
					{ absoluteX: 220, absoluteY: 340 },
				],
			} as any,
			gestures,
			true,
		);
		updateAbsolutePinchFocalPoint(
			{
				allTouches: [
					{ absoluteX: 130, absoluteY: 250 },
					{ absoluteX: 250, absoluteY: 370 },
				],
			} as any,
			gestures,
			false,
		);

		expect(gestures.focalX.get()).toBe(190);
		expect(gestures.focalY.get()).toBe(310);
		expect(gestures.pinchOriginX.get()).toBe(160);
		expect(gestures.pinchOriginY.get()).toBe(280);
	});

	it("derives continuous rotation from the pinch touch pair", () => {
		const gestures = createGestureStore();
		const lastAngle = shared(0);
		const accumulatedRotation = shared(0);

		updatePinchRotation(
			{
				allTouches: [
					{ absoluteX: 100, absoluteY: 200 },
					{ absoluteX: 200, absoluteY: 200 },
				],
			} as any,
			gestures,
			lastAngle,
			accumulatedRotation,
			true,
		);
		updatePinchRotation(
			{
				allTouches: [
					{ absoluteX: 150, absoluteY: 150 },
					{ absoluteX: 150, absoluteY: 250 },
				],
			} as any,
			gestures,
			lastAngle,
			accumulatedRotation,
			false,
		);

		expect(gestures.rotation.get()).toBeCloseTo(Math.PI / 2);
		expect(gestures.raw.rotation.get()).toBeCloseTo(Math.PI / 2);
	});

	it("marks a cancelled pan release as settling until gesture reset finishes", () => {
		const { runtime, gestures } = createRuntime();
		gestures.dragging.set(1);

		finalizePanRelease(
			{
				target: 1,
				shouldDismiss: false,
				initialVelocity: 0,
				handoffVelocity: 0,
				transitionSpec: undefined,
				resetSpec: { duration: 200, __finished: false } as any,
			},
			runtime,
			undefined,
			{ width: 390, height: 844 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(gestures.dragging.get()).toBe(0);
		expect(gestures.dismissing.get()).toBe(0);
		expect(gestures.settling.get()).toBe(1);
	});

	it("returns a cancelled gesture to public rest without closing", () => {
		const state = createRuntime();
		state.gestures.dragging.set(1);

		finalizePanRelease(
			{
				target: 1,
				shouldDismiss: false,
				initialVelocity: 0,
				transitionSpec: undefined,
				resetSpec: undefined,
			},
			state.runtime,
			undefined,
			{ width: 390, height: 844 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(exposeToInterpolator(state)).toMatchObject({
			closing: 0,
			settled: 1,
			gesture: { dragging: 0, dismissing: 0, settling: 0 },
		});
	});

	it("keeps public settlement pending through a cancelled gesture handoff", () => {
		const raf = installDeferredAnimationFrame();
		const state = createRuntime();

		startPanBase(state.runtime);

		expect(exposeToInterpolator(state)).toMatchObject({
			settled: 0,
			gesture: { dragging: 1 },
		});

		finalizePanRelease(
			{
				target: 1,
				shouldDismiss: false,
				initialVelocity: 0,
				transitionSpec: undefined,
				resetSpec: { duration: 200, __finished: false } as any,
			},
			state.runtime,
			undefined,
			{ width: 390, height: 844 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(exposeToInterpolator(state)).toMatchObject({
			settled: 0,
			gesture: { dragging: 0, settling: 1 },
		});

		state.gestures.settling.set(0);
		state.animations.progressAnimating.set(0);
		state.animations.progressSettled.set(1);

		expect(exposeToInterpolator(state)).toMatchObject({
			settled: 1,
		});

		raf.flush();
		raf.restore();
	});

	it("clears a stale visual-settle signal when a drag takes over", () => {
		const state = createRuntime();
		state.animations.progressAnimating.set(1);
		state.animations.progressSettled.set(1);

		startPanBase(state.runtime);

		expect(exposeToInterpolator(state)).toMatchObject({
			settled: 0,
			gesture: { dragging: 1 },
		});

		finalizePanRelease(
			{
				target: 1,
				shouldDismiss: false,
				initialVelocity: 0,
				transitionSpec: undefined,
				resetSpec: { duration: 200, __finished: false } as any,
			},
			state.runtime,
			undefined,
			{ width: 390, height: 844 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(exposeToInterpolator(state)).toMatchObject({
			settled: 0,
			gesture: { dragging: 0, settling: 1 },
		});
	});

	it("does not mark cancelled pan reset as an entering transition", () => {
		const { runtime, animations } = createRuntime();

		finalizePanRelease(
			{
				target: 1,
				shouldDismiss: false,
				initialVelocity: 0,
				transitionSpec: {
					open: { duration: 200, __finished: false } as any,
					close: { duration: 200 } as any,
				},
				resetSpec: { duration: 200, __finished: false } as any,
			},
			runtime,
			undefined,
			{ width: 390, height: 844 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(animations.entering.get()).toBe(0);
	});

	it("clears settling after a cancelled pan reset finishes", () => {
		const { runtime, gestures } = createRuntime();
		gestures.dragging.set(1);

		finalizePanRelease(
			{
				target: 1,
				shouldDismiss: false,
				initialVelocity: 0,
				transitionSpec: undefined,
				resetSpec: { duration: 200 } as any,
			},
			runtime,
			undefined,
			{ width: 390, height: 844 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(gestures.dragging.get()).toBe(0);
		expect(gestures.dismissing.get()).toBe(0);
		expect(gestures.settling.get()).toBe(0);
	});

	it("does not start a progress animation for a cancelled no-op pan release", () => {
		const { runtime, gestures, animations } = createRuntime();
		animations.transitionProgress.set(1);
		gestures.dragging.set(1);

		finalizePanRelease(
			{
				target: 1,
				shouldDismiss: false,
				initialVelocity: 0,
				transitionSpec: {
					open: { duration: 200, __finished: false } as any,
					close: { duration: 200 } as any,
				},
				resetSpec: undefined,
			},
			runtime,
			undefined,
			{ width: 390, height: 844 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(gestures.dragging.get()).toBe(0);
		expect(gestures.dismissing.get()).toBe(0);
		expect(animations.progressAnimating.get()).toBe(0);
	});

	it("keeps visual motion active while a cancelled drag resets to rest", () => {
		const raf = installDeferredAnimationFrame();
		const state = createRuntime();
		state.gestures.active.set("vertical");

		try {
			startPanBase(state.runtime);
			state.gestures.y.set(220);
			state.gestures.normY.set(220 / 844);
			state.gestures.internal.progressDeltaY.set(220 / 844);

			finalizePanRelease(
				{
					target: 1,
					shouldDismiss: false,
					initialVelocity: 0,
					transitionSpec: {
						open: { duration: 200, __finished: false } as any,
						close: { duration: 200 } as any,
					},
					resetSpec: { duration: 200, __finished: false } as any,
				},
				state.runtime,
				undefined,
				{ width: 390, height: 844 },
				{ velocityX: 0, velocityY: 0 } as any,
			);

			expect(exposeToInterpolator(state)).toMatchObject({
				animating: 1,
				settled: 0,
				gesture: { dragging: 0, settling: 1 },
			});
		} finally {
			raf.restore();
		}
	});

	it("keeps visual motion active while a cancelled pinch resets to rest", () => {
		const state = createRuntime();
		state.gestures.dragging.set(1);
		state.gestures.active.set("pinch-in");
		state.gestures.scale.set(0.7);
		state.gestures.normScale.set(-0.3);

		finalizePinchRelease(
			{
				target: 1,
				shouldDismiss: false,
				initialVelocity: 0,
				handoffVelocity: 0,
				transitionSpec: undefined,
				resetSpec: { duration: 200, __finished: false } as any,
			},
			state.runtime,
			undefined,
		);

		expect(exposeToInterpolator(state)).toMatchObject({
			animating: 1,
			settled: 0,
			gesture: { dragging: 0, settling: 1 },
		});
	});

	it("keeps public motion pending when an interrupted entrance finishes during a drag", () => {
		const raf = installDeferredAnimationFrame();
		const deferredCallbacks: Array<() => void> = [];
		globalThis.__reanimatedDeferredTimingCallbacks = deferredCallbacks;
		const state = createStoredRuntime();
		state.animations.transitionProgress.set(0);
		state.animations.visualProgress.set(0);
		state.animations.entering.set(1);
		state.animations.progressSettled.set(0);

		try {
			animateToProgress({
				target: "open",
				spec: { open: { duration: 200, __defer: true } as any },
				emitWillAnimate: false,
				animations: state.animations,
				targetProgress: state.runtime.stores.system.targetProgress,
				animationProgress: state.runtime.stores.system.animationProgress,
				isDragging: state.gestures.dragging,
			});

			state.gestures.active.set("vertical");
			startPanBase(state.runtime);
			trackPanGesture(
				{
					translationX: 0,
					translationY: 220,
					velocityX: 0,
					velocityY: 0,
				},
				{
					translationX: 0,
					translationY: 220,
					velocityX: 0,
					velocityY: 0,
				},
				state.gestures,
				{ width: 390, height: 844 },
			);

			expect(deferredCallbacks).toHaveLength(1);
			deferredCallbacks[0]?.();
			raf.flush();

			expect(exposeToInterpolator(state)).toMatchObject({
				animating: 1,
				settled: 0,
				gesture: { dragging: 1 },
			});
		} finally {
			Reflect.deleteProperty(globalThis, "__reanimatedDeferredTimingCallbacks");
			raf.restore();
			state.clear();
		}
	});

	it("resets pan values without dismissing when pinch owns the composition", () => {
		const { runtime, gestures, animations } = createRuntime();
		const composition = shared<GestureCompositionOwner>("pinch");
		let requestedDismiss = false;
		animations.transitionProgress.set(0.64);
		animations.progressAnimating.set(0);
		gestures.dragging.set(1);
		gestures.dismissing.set(1);
		gestures.settling.set(0);
		gestures.x.set(48);
		gestures.y.set(-36);
		gestures.normX.set(0.12);
		gestures.normY.set(-0.08);
		gestures.internal.progressDeltaX.set(0.12);
		gestures.internal.progressDeltaY.set(-0.08);
		gestures.raw.x.set(52);
		gestures.raw.y.set(-40);
		gestures.raw.normX.set(0.13);
		gestures.raw.normY.set(-0.09);
		gestures.velocity.set(0.4);

		finalizePanRelease(
			{
				target: 0,
				shouldDismiss: true,
				initialVelocity: 0,
				transitionSpec: undefined,
				resetSpec: undefined,
			},
			runtime,
			() => {},
			{ width: 400, height: 800 },
			{ velocityX: 120, velocityY: -80 } as any,
			() => {
				requestedDismiss = true;
			},
			composition,
		);

		expect(requestedDismiss).toBe(false);
		expect(composition.get()).toBe("pinch");
		expect(gestures.x.get()).toBe(0);
		expect(gestures.y.get()).toBe(0);
		expect(gestures.normX.get()).toBe(0);
		expect(gestures.normY.get()).toBe(0);
		expect(gestures.internal.progressDeltaX.get()).toBe(0);
		expect(gestures.internal.progressDeltaY.get()).toBe(0);
		expect(gestures.raw.x.get()).toBe(0);
		expect(gestures.raw.y.get()).toBe(0);
		expect(gestures.raw.normX.get()).toBe(0);
		expect(gestures.raw.normY.get()).toBe(0);
		expect(gestures.velocity.get()).toBe(0);
		expect(gestures.dragging.get()).toBe(1);
		expect(gestures.dismissing.get()).toBe(1);
		expect(gestures.settling.get()).toBe(0);
		expect(animations.transitionProgress.get()).toBe(0.64);
		expect(animations.progressAnimating.get()).toBe(0);
	});

	it("does not mark a dismissing pan release as settling", () => {
		const { runtime, gestures } = createRuntime();
		gestures.dragging.set(1);
		gestures.active.set("vertical");

		finalizePanRelease(
			{
				target: 0,
				shouldDismiss: true,
				initialVelocity: 0,
				handoffVelocity: 0.6,
				transitionSpec: undefined,
				resetSpec: { duration: 200, __finished: false } as any,
			},
			runtime,
			() => {},
			{ width: 390, height: 844 },
			{ velocityX: 2400, velocityY: -1688 } as any,
		);

		expect(gestures.dragging.get()).toBe(0);
		expect(gestures.dismissing.get()).toBe(1);
		expect(gestures.settling.get()).toBe(0);
		expect(gestures.velocity.get()).toBe(0);
		expect(gestures.internal.snapshot.velocity.get()).toBeCloseTo(0.5, 5);
		expect(gestures.internal.snapshot.active.get()).toBe("vertical");
	});

	it("sets public closing only when a pan dismissal is committed", () => {
		const raf = installDeferredAnimationFrame();
		const state = createRuntime();
		state.gestures.active.set("vertical");

		startPanBase(state.runtime);

		expect(exposeToInterpolator(state)).toMatchObject({
			closing: 0,
			gesture: { dragging: 1 },
		});

		finalizePanRelease(
			{
				target: 0,
				shouldDismiss: true,
				initialVelocity: 0,
				transitionSpec: undefined,
				resetSpec: undefined,
			},
			state.runtime,
			() => {},
			{ width: 390, height: 844 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(exposeToInterpolator(state)).toMatchObject({
			closing: 1,
			gesture: { dragging: 0, dismissing: 1 },
		});

		raf.flush();
		raf.restore();
	});

	it("snapshots raw pan displacement during a dismissing release", () => {
		const { runtime, gestures } = createRuntime();
		gestures.dragging.set(1);
		gestures.raw.y.set(320);
		gestures.raw.normY.set(0.4);

		finalizePanRelease(
			{
				target: 0,
				shouldDismiss: true,
				initialVelocity: 0,
				transitionSpec: undefined,
				resetSpec: { duration: 200, __finished: false } as any,
			},
			runtime,
			() => {},
			{ width: 390, height: 800 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(gestures.raw.y.get()).toBe(0);
		expect(gestures.raw.normY.get()).toBe(0);
		expect(gestures.internal.snapshot.raw.y.get()).toBe(320);
		expect(gestures.internal.snapshot.raw.normY.get()).toBe(0.4);
	});

	it("snapshots live normalized pan displacement during a dismissing release", () => {
		const { runtime, gestures } = createRuntime();
		gestures.dragging.set(1);
		gestures.y.set(320);
		gestures.normY.set(0.4);
		gestures.internal.progressDeltaY.set(0.4);

		finalizePanRelease(
			{
				target: 0,
				shouldDismiss: true,
				initialVelocity: 0,
				transitionSpec: undefined,
				resetSpec: { duration: 200, __finished: false } as any,
			},
			runtime,
			() => {},
			{ width: 390, height: 800 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(gestures.y.get()).toBe(0);
		expect(gestures.normY.get()).toBe(0);
		expect(gestures.internal.progressDeltaY.get()).toBe(0);
		expect(gestures.internal.snapshot.y.get()).toBe(320);
		expect(gestures.internal.snapshot.normY.get()).toBe(0.4);
	});

	it("resets live normalized pan displacement during a dismissing release", () => {
		const { runtime, gestures } = createRuntime();
		gestures.dragging.set(1);
		gestures.y.set(320);
		gestures.normY.set(0.4);
		gestures.internal.progressDeltaY.set(0.4);

		finalizePanRelease(
			{
				target: 0,
				shouldDismiss: true,
				initialVelocity: 0,
				transitionSpec: undefined,
				resetSpec: { duration: 200, __finished: false } as any,
			},
			runtime,
			() => {},
			{ width: 390, height: 800 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(gestures.y.get()).toBe(0);
		expect(gestures.normY.get()).toBe(0);
		expect(gestures.internal.progressDeltaY.get()).toBe(0);
	});

	it("resets live normalized pan displacement during a cancelled release", () => {
		const { runtime, gestures } = createRuntime();
		gestures.dragging.set(1);
		gestures.y.set(320);
		gestures.normY.set(0.4);
		gestures.internal.progressDeltaY.set(0.4);

		finalizePanRelease(
			{
				target: 1,
				shouldDismiss: false,
				initialVelocity: 0,
				transitionSpec: undefined,
				resetSpec: { duration: 200, __finished: false } as any,
			},
			runtime,
			undefined,
			{ width: 390, height: 800 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(gestures.y.get()).toBe(0);
		expect(gestures.normY.get()).toBe(0);
		expect(gestures.internal.progressDeltaY.get()).toBe(0);
	});

	it("keeps pinch focal point during a cancelled animated reset", () => {
		const { runtime, gestures } = createRuntime();
		gestures.dragging.set(1);
		gestures.scale.set(0.7);
		gestures.normScale.set(-0.3);
		gestures.focalX.set(120);
		gestures.focalY.set(240);
		gestures.pinchOriginX.set(100);
		gestures.pinchOriginY.set(220);

		finalizePinchRelease(
			{
				target: 1,
				shouldDismiss: false,
				initialVelocity: 0,
				handoffVelocity: 0,
				transitionSpec: undefined,
				resetSpec: { duration: 200, __finished: false } as any,
			},
			runtime,
			undefined,
			() => {},
		);

		expect(gestures.focalX.get()).toBe(120);
		expect(gestures.focalY.get()).toBe(240);
		expect(gestures.pinchOriginX.get()).toBe(100);
		expect(gestures.pinchOriginY.get()).toBe(220);
	});

	it("snapshots raw pinch scale and rotation during a dismissing release", () => {
		const { runtime, gestures } = createRuntime();
		gestures.dragging.set(1);
		gestures.raw.scale.set(0.7);
		gestures.raw.normScale.set(-0.3);
		gestures.raw.rotation.set(0.2);
		gestures.focalX.set(120);
		gestures.focalY.set(240);
		gestures.pinchOriginX.set(100);
		gestures.pinchOriginY.set(220);

		finalizePinchRelease(
			{
				target: 0,
				shouldDismiss: true,
				initialVelocity: 0,
				handoffVelocity: 0.6,
				transitionSpec: undefined,
				resetSpec: { duration: 200, __finished: false } as any,
			},
			runtime,
			() => {},
		);

		expect(gestures.raw.scale.get()).toBe(1);
		expect(gestures.raw.normScale.get()).toBe(0);
		expect(gestures.raw.rotation.get()).toBe(0);
		expect(gestures.internal.snapshot.raw.scale.get()).toBe(0.7);
		expect(gestures.internal.snapshot.raw.normScale.get()).toBe(-0.3);
		expect(gestures.internal.snapshot.raw.rotation.get()).toBe(0.2);
		expect(gestures.internal.snapshot.velocity.get()).toBe(0.6);
		expect(gestures.internal.snapshot.focalX.get()).toBe(120);
		expect(gestures.internal.snapshot.focalY.get()).toBe(240);
		expect(gestures.internal.snapshot.pinchOriginX.get()).toBe(100);
		expect(gestures.internal.snapshot.pinchOriginY.get()).toBe(220);
		expect(gestures.focalX.get()).toBe(0);
		expect(gestures.focalY.get()).toBe(0);
		expect(gestures.pinchOriginX.get()).toBe(0);
		expect(gestures.pinchOriginY.get()).toBe(0);
	});

});
