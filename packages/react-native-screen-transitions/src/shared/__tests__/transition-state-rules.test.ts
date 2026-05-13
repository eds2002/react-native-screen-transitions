import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import {
	createScreenTransitionState,
	DEFAULT_SCREEN_TRANSITION_OPTIONS,
	LOGICAL_SETTLE_PROGRESS_THRESHOLD,
	LOGICAL_SETTLE_REQUIRED_FRAMES,
} from "../constants";
import { hydrateTransitionState } from "../providers/screen/animation/helpers/hydrate-transition-state";
import type { BuiltState } from "../providers/screen/animation/helpers/hydrate-transition-state/types";
import type { ScreenTransitionOptions } from "../types/animation.types";

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

const createGestureStore = (
	overrides: Partial<{
		dragging: number;
		settling: number;
		dismissing: number;
		normX: number;
		normY: number;
		normScale: number;
		active: string | null;
	}> = {},
) => {
	const normX = shared(overrides.normX ?? 0);
	const normY = shared(overrides.normY ?? 0);
	const dismissing = shared(overrides.dismissing ?? 0);
	const dragging = shared(overrides.dragging ?? 0);

	return {
		x: shared(0),
		y: shared(0),
		normX,
		normY,
		scale: shared(1),
		normScale: shared(overrides.normScale ?? 0),
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
		settling: shared(overrides.settling ?? 0),
		active: shared(overrides.active ?? null),
		direction: shared(overrides.active ?? null),
		normalizedX: normX,
		normalizedY: normY,
		isDismissing: dismissing,
		isDragging: dragging,
	} as any;
};

const createBuiltState = (
	overrides: Partial<{
		progress: number;
		progressAnimating: number;
		closing: number;
		entering: number;
		targetProgress: number;
		logicalSettleFrameCount: number;
		gesture: ReturnType<typeof createGestureStore>;
		options: ScreenTransitionOptions;
	}> = {},
): BuiltState => {
	const options = overrides.options ?? DEFAULT_SCREEN_TRANSITION_OPTIONS;
	const state = createScreenTransitionState(
		{
			key: "route-a",
			name: "RouteA",
		},
		undefined,
		false,
		options,
	);

	return {
		progress: shared(overrides.progress ?? 1),
		willAnimate: shared(0),
		closing: shared(overrides.closing ?? 0),
		progressAnimating: shared(overrides.progressAnimating ?? 0),
		entering: shared(overrides.entering ?? 0),
		gesture: overrides.gesture ?? createGestureStore(),
		route: state.route,
		options,
		navigationMaskEnabled: false,
		targetProgress: shared(overrides.targetProgress ?? 1),
		logicalSettleFrameCount: shared(overrides.logicalSettleFrameCount ?? 0),
		resolvedAutoSnapPoint: shared(-1),
		measuredContentLayout: shared(null),
		contentLayoutSlot: { width: 0, height: 0 },
		hasAutoSnapPoint: false,
		sortedNumericSnapPoints: [],
		unwrapped: state,
	};
};

const hydrate = (
	state: BuiltState,
	effectiveOptions?: ScreenTransitionOptions,
) =>
	hydrateTransitionState(
		state,
		{ width: 390, height: 844 },
		effectiveOptions,
	);

describe("transition state rules", () => {
	it("keeps entering and closing as source lifecycle flags", () => {
		const state = createBuiltState({
			targetProgress: 0,
			closing: 0,
			entering: 0,
		});

		const hydrated = hydrate(state);

		expect(hydrated.closing).toBe(0);
		expect(hydrated.entering).toBe(0);
	});

	it("derives public animating from progress animation", () => {
		const hydrated = hydrate(
			createBuiltState({
				progressAnimating: 1,
			}),
		);

		expect(hydrated.animating).toBe(1);
		expect(hydrated.settled).toBe(0);
	});

	it("derives public animating from active gesture reset", () => {
		const hydrated = hydrate(
			createBuiltState({
				progressAnimating: 0,
				gesture: createGestureStore({ settling: 1 }),
			}),
		);

		expect(hydrated.animating).toBe(1);
		expect(hydrated.settled).toBe(0);
	});

	it("derives settled when progress and gestures are at rest", () => {
		const hydrated = hydrate(createBuiltState());

		expect(hydrated.animating).toBe(0);
		expect(hydrated.settled).toBe(1);
	});

	it("keeps settled false while closing is active", () => {
		const hydrated = hydrate(
			createBuiltState({
				closing: 1,
			}),
		);

		expect(hydrated.animating).toBe(0);
		expect(hydrated.settled).toBe(0);
	});

	it("keeps settled false while gesture dismissal is active", () => {
		const hydrated = hydrate(
			createBuiltState({
				gesture: createGestureStore({ dismissing: 1 }),
			}),
		);

		expect(hydrated.animating).toBe(0);
		expect(hydrated.settled).toBe(0);
	});

	it("requires consecutive near-target frames before logically settling", () => {
		const state = createBuiltState({
			progress: 1,
			targetProgress: 1,
		});

		for (let i = 0; i < LOGICAL_SETTLE_REQUIRED_FRAMES - 1; i++) {
			expect(hydrate(state).logicallySettled).toBe(0);
		}

		expect(hydrate(state).logicallySettled).toBe(1);
	});

	it("resets logical settle counting when progress leaves the target threshold", () => {
		const state = createBuiltState({
			progress: 1,
			targetProgress: 1,
		});

		hydrate(state);
		hydrate(state);

		state.progress.set(0.5);
		expect(hydrate(state).logicallySettled).toBe(0);
		expect(state.logicalSettleFrameCount.get()).toBe(0);

		state.progress.set(1);
		expect(hydrate(state).logicallySettled).toBe(0);
		expect(state.logicalSettleFrameCount.get()).toBe(1);
	});

	it("preserves logical settlement across tiny post-settle spring drift", () => {
		const state = createBuiltState({
			progress: 1,
			targetProgress: 1,
			logicalSettleFrameCount: LOGICAL_SETTLE_REQUIRED_FRAMES,
		});

		expect(hydrate(state).logicallySettled).toBe(1);

		state.progress.set(1 + LOGICAL_SETTLE_PROGRESS_THRESHOLD * 2);

		expect(hydrate(state).logicallySettled).toBe(1);
	});

	it("does not preserve logical settlement after meaningful progress movement", () => {
		const state = createBuiltState({
			progress: 1,
			targetProgress: 1,
			logicalSettleFrameCount: LOGICAL_SETTLE_REQUIRED_FRAMES,
		});

		expect(hydrate(state).logicallySettled).toBe(1);

		state.progress.set(0.5);

		expect(hydrate(state).logicallySettled).toBe(0);
	});

	it("does not preserve logical settlement while progress is actively animating", () => {
		const state = createBuiltState({
			progress: 1 + LOGICAL_SETTLE_PROGRESS_THRESHOLD * 2,
			progressAnimating: 1,
			targetProgress: 1,
			logicalSettleFrameCount: LOGICAL_SETTLE_REQUIRED_FRAMES,
		});

		expect(hydrate(state).logicallySettled).toBe(0);
	});

	it("keeps logically settled false while dragging", () => {
		const state = createBuiltState({
			progress: 1,
			targetProgress: 1,
			logicalSettleFrameCount: LOGICAL_SETTLE_REQUIRED_FRAMES,
			gesture: createGestureStore({ dragging: 1 }),
		});

		const hydrated = hydrate(state);

		expect(hydrated.animating).toBe(1);
		expect(hydrated.settled).toBe(0);
		expect(hydrated.logicallySettled).toBe(0);
	});

	it("allows logical settlement while a dismissing gesture holds residual values", () => {
		const state = createBuiltState({
			progress: 0,
			targetProgress: 0,
			closing: 1,
			logicalSettleFrameCount: LOGICAL_SETTLE_REQUIRED_FRAMES,
			gesture: createGestureStore({
				dismissing: 1,
				normY: 0.4,
			}),
		});

		const hydrated = hydrate(state);

		expect(hydrated.animating).toBe(0);
		expect(hydrated.settled).toBe(0);
		expect(hydrated.logicallySettled).toBe(1);
	});

	it("derives effective progress from gestures when gestureDrivesProgress is enabled", () => {
		const hydrated = hydrate(
			createBuiltState({
				progress: 1,
				gesture: createGestureStore({ normY: 0.25 }),
				options: {
					gestureDirection: "vertical",
					gestureDrivesProgress: true,
				},
			}),
		);

		expect(hydrated.progress).toBe(0.75);
	});

	it("ignores pan gesture progress outside the configured direction", () => {
		const hydrated = hydrate(
			createBuiltState({
				progress: 1,
				gesture: createGestureStore({ normX: 0.25 }),
				options: {
					gestureDirection: "vertical",
					gestureDrivesProgress: true,
				},
			}),
		);

		expect(hydrated.progress).toBe(1);
	});

	it("keeps base progress when gestureDrivesProgress is disabled", () => {
		const hydrated = hydrate(
			createBuiltState({
				progress: 1,
				gesture: createGestureStore({ normY: 0.25 }),
				options: {
					gestureDirection: "vertical",
					gestureDrivesProgress: true,
				},
			}),
			{
				gestureDirection: "vertical",
				gestureDrivesProgress: false,
			},
		);

		expect(hydrated.progress).toBe(1);
	});
});
