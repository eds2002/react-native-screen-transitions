import { afterEach, describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import {
	createScreenTransitionState,
	DEFAULT_SCREEN_TRANSITION_OPTIONS,
} from "../constants";
import { hydrateTransitionState } from "../providers/screen/animation/helpers/hydrate-transition-state";
import { finalizePanRelease, startPanBase } from "../providers/screen/gestures/helpers/pan-phases";
import { startPinchBase } from "../providers/screen/gestures/helpers/pinch-phases";
import type { AnimationStoreMap } from "../stores/animation.store";
import type { GestureStoreMap } from "../stores/gesture.store";

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
		scale: shared(1),
		normScale: shared(0),
		focalX: shared(0),
		focalY: shared(0),
		raw: {
			x: shared(0),
			y: shared(0),
			normX: shared(0),
			normY: shared(0),
			scale: shared(1),
			normScale: shared(0),
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
	progress: shared(1),
	willAnimate: shared(0),
	animating: shared(0),
	closing: shared(0),
	entering: shared(0),
	settled: shared(1),
	logicallySettled: shared(1),
});

const createRuntime = () => {
	const gestures = createGestureStore();
	const animations = createAnimations();
	const runtime = {
		participation: { canDismiss: true, effectiveSnapPoints: {} },
		policy: {
			gestureReleaseVelocityScale: 1,
		},
		stores: {
			gestures,
			animations,
			system: {
				targetProgress: shared(1),
			},
		},
		gestureProgressBaseline: shared(1),
		lockedSnapPoint: shared(1),
	};

	return { runtime: runtime as any, gestures, animations };
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

	it("does not emit willAnimate when a pan restarts while gesture values are settling", () => {
		const raf = installDeferredAnimationFrame();
		const { runtime, gestures, animations } = createRuntime();
		gestures.settling.set(1);

		startPanBase(runtime);

		expect(gestures.dragging.get()).toBe(1);
		expect(gestures.settling.get()).toBe(0);
		expect(animations.willAnimate.get()).toBe(0);

		raf.flush();
		raf.restore();
	});

	it("does not emit willAnimate when a pinch restarts while gesture values are settling", () => {
		const raf = installDeferredAnimationFrame();
		const { runtime, gestures, animations } = createRuntime();
		gestures.settling.set(1);

		startPinchBase(runtime, { focalX: 12, focalY: 24 } as any);

		expect(gestures.dragging.get()).toBe(1);
		expect(gestures.settling.get()).toBe(0);
		expect(animations.willAnimate.get()).toBe(0);

		raf.flush();
		raf.restore();
	});

	it("marks a cancelled pan release as settling until gesture reset finishes", () => {
		const { runtime, gestures } = createRuntime();
		gestures.dragging.set(1);

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
			{ width: 390, height: 844 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(gestures.dragging.get()).toBe(0);
		expect(gestures.dismissing.get()).toBe(0);
		expect(gestures.settling.get()).toBe(1);
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

	it("does not mark a dismissing pan release as settling", () => {
		const { runtime, gestures } = createRuntime();
		gestures.dragging.set(1);

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
			{ width: 390, height: 844 },
			{ velocityX: 0, velocityY: 0 } as any,
		);

		expect(gestures.dragging.get()).toBe(0);
		expect(gestures.dismissing.get()).toBe(1);
		expect(gestures.settling.get()).toBe(0);
	});

	it("hydrates public animating from explicit gesture settling state", () => {
		const gestures = createGestureStore();
		gestures.settling.set(1);
		const state = createScreenTransitionState({
			key: "route-a",
			name: "RouteA",
		});

		const hydrated = hydrateTransitionState(
			{
				...createAnimations(),
				progress: shared(1),
				animating: shared(0),
				settled: shared(1),
				logicallySettled: shared(1),
				gesture: gestures,
				route: state.route,
				options: DEFAULT_SCREEN_TRANSITION_OPTIONS,
				navigationMaskEnabled: false,
				targetProgress: shared(1),
				resolvedAutoSnapPoint: shared(-1),
				measuredContentLayout: shared(null),
				contentLayoutSlot: { width: 0, height: 0 },
				hasAutoSnapPoint: false,
				sortedNumericSnapPoints: [],
				unwrapped: state,
			},
			{ width: 390, height: 844 },
		);

		expect(hydrated.gesture.settling).toBe(1);
		expect(hydrated.animating).toBe(1);
		expect(hydrated.settled).toBe(0);
	});
});
