import { afterEach, describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import {
	finalizePanRelease,
	startPanBase,
} from "../providers/screen/gestures/helpers/pan-phases";
import {
	finalizePinchRelease,
	startPinchBase,
} from "../providers/screen/gestures/helpers/pinch-phases";
import type { AnimationStoreMap } from "../stores/animation.store";
import type { GestureStoreMap } from "../stores/gesture.store";
import { animateToProgress } from "../utils/animation/animate-to-progress";

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
	progressAnimating: shared(0),
	closing: shared(0),
	entering: shared(0),
});

const createRuntime = (
	policyOverrides: Partial<{
		gestureDrivesProgress: boolean;
		gestureReleaseVelocityScale: number;
	}> = {},
) => {
	const gestures = createGestureStore();
	const animations = createAnimations();
	const runtime = {
		participation: { canDismiss: true, effectiveSnapPoints: {} },
		policy: {
			gestureDrivesProgress: true,
			gestureReleaseVelocityScale: 1,
			...policyOverrides,
		},
		stores: {
			gestures,
			animations,
			system: {
				targetProgress: shared(1),
				logicalSettleFrameCount: shared(0),
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
	it("marks opening as entering before the willAnimate pulse is observed", () => {
		const raf = installDeferredAnimationFrame();
		const animations = createAnimations();
		animations.progress.set(0);

		animateToProgress({
			target: "open",
			animations,
			targetProgress: shared(0),
		});

		expect(animations.willAnimate.get()).toBe(1);
		expect(animations.entering.get()).toBe(1);
		expect(animations.closing.get()).toBe(0);

		raf.flush();
		raf.restore();
	});

	it("marks closing before the willAnimate pulse is observed", () => {
		const raf = installDeferredAnimationFrame();
		const animations = createAnimations();
		animations.entering.set(1);

		animateToProgress({
			target: "close",
			animations,
			targetProgress: shared(1),
		});

		expect(animations.willAnimate.get()).toBe(1);
		expect(animations.closing.get()).toBe(1);
		expect(animations.entering.get()).toBe(0);

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

	it("does not emit willAnimate when a pan restarts while gesture values are settling", () => {
		const raf = installDeferredAnimationFrame();
		const { runtime, gestures, animations } = createRuntime();
		gestures.settling.set(1);
		gestures.normY.set(0.25);

		startPanBase(runtime);

		expect(gestures.dragging.get()).toBe(1);
		expect(gestures.settling.get()).toBe(0);
		expect(animations.willAnimate.get()).toBe(0);

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

	it("does not emit willAnimate when a pinch restarts while gesture values are settling", () => {
		const raf = installDeferredAnimationFrame();
		const { runtime, gestures, animations } = createRuntime();
		gestures.settling.set(1);
		gestures.normScale.set(0.25);

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

	it("does not start a progress animation for a cancelled no-op pan release", () => {
		const { runtime, gestures, animations } = createRuntime();
		animations.progress.set(1);
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

	it("keeps raw pan displacement during a dismissing release", () => {
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

		expect(gestures.raw.y.get()).toBe(320);
		expect(gestures.raw.normY.get()).toBe(0.4);
	});

	it("keeps live normalized pan displacement during a freeform dismissing release", () => {
		const { runtime, gestures } = createRuntime({
			gestureDrivesProgress: false,
		});
		gestures.dragging.set(1);
		gestures.y.set(320);
		gestures.normY.set(0.4);

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
		expect(gestures.normY.get()).toBe(0.4);
	});

	it("resets live normalized pan displacement during a progress-driven dismissing release", () => {
		const { runtime, gestures } = createRuntime({
			gestureDrivesProgress: true,
		});
		gestures.dragging.set(1);
		gestures.y.set(320);
		gestures.normY.set(0.4);

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
	});

	it("resets live normalized pan displacement during a cancelled freeform release", () => {
		const { runtime, gestures } = createRuntime({
			gestureDrivesProgress: false,
		});
		gestures.dragging.set(1);
		gestures.y.set(320);
		gestures.normY.set(0.4);

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
	});

	it("keeps raw pinch displacement during a dismissing release", () => {
		const { runtime, gestures } = createRuntime();
		gestures.dragging.set(1);
		gestures.raw.scale.set(0.7);
		gestures.raw.normScale.set(-0.3);

		finalizePinchRelease(
			{
				target: 0,
				shouldDismiss: true,
				initialVelocity: 0,
				transitionSpec: undefined,
				resetSpec: { duration: 200, __finished: false } as any,
			},
			runtime,
			() => {},
		);

		expect(gestures.raw.scale.get()).toBe(0.7);
		expect(gestures.raw.normScale.get()).toBe(-0.3);
	});

});
