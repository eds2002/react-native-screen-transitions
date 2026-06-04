import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import {
	createScreenTransitionState,
	DEFAULT_SCREEN_TRANSITION_OPTIONS,
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
		rotation: number;
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
		velocity: shared(0),
		scale: shared(1),
		normScale: shared(overrides.normScale ?? 0),
		focalX: shared(0),
		focalY: shared(0),
		rotation: shared(overrides.rotation ?? 0),
		raw: {
			x: shared(0),
			y: shared(0),
			normX: shared(0),
			normY: shared(0),
			scale: shared(1),
			normScale: shared(0),
			rotation: shared(0),
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
		progressSettled: number;
		closing: number;
		entering: number;
		targetProgress: number;
		gesture: ReturnType<typeof createGestureStore>;
		options: ScreenTransitionOptions;
		sortedNumericSnapPoints: number[];
	}> = {},
): BuiltState => {
	const options = overrides.options ?? DEFAULT_SCREEN_TRANSITION_OPTIONS;
	const state = createScreenTransitionState(
		{
			key: "route-a",
			name: "RouteA",
		},
		undefined,
		options,
	);

	return {
		progress: shared(overrides.progress ?? 1),
		effectiveProgress: shared(overrides.progress ?? 1),
		willAnimate: shared(0),
		closing: shared(overrides.closing ?? 0),
		progressAnimating: shared(overrides.progressAnimating ?? 0),
		progressSettled: shared(overrides.progressSettled ?? 1),
		entering: shared(overrides.entering ?? 0),
		gesture: overrides.gesture ?? createGestureStore(),
		route: state.route,
		options,
		optionsSlot: {},
		targetProgress: shared(overrides.targetProgress ?? 1),
		resolvedAutoSnapPoint: shared(-1),
		measuredContentLayout: shared(null),
		contentLayoutSlot: { width: 0, height: 0 },
		hasAutoSnapPoint: false,
		sortedNumericSnapPoints: overrides.sortedNumericSnapPoints ?? [],
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
				progressSettled: 0,
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

	it("derives public animating from residual rotation without changing progress", () => {
		const hydrated = hydrate(
			createBuiltState({
				progress: 1,
				gesture: createGestureStore({ rotation: 0.25 }),
				options: {
					gestureDirection: "pinch-in",
					gestureProgressMode: "progress-driven",
				},
			}),
		);

		expect(hydrated.progress).toBe(1);
		expect(hydrated.animating).toBe(1);
		expect(hydrated.settled).toBe(0);
	});

	it("derives settled when progress and gestures are at rest", () => {
		const hydrated = hydrate(createBuiltState());

		expect(hydrated.animating).toBe(0);
		expect(hydrated.settled).toBe(1);
	});

	it("does not block visual settlement while closing is active", () => {
		const hydrated = hydrate(
			createBuiltState({
				closing: 1,
			}),
		);

		expect(hydrated.animating).toBe(0);
		expect(hydrated.settled).toBe(1);
		expect(hydrated.logicallySettled).toBe(1);
	});

	it("does not block visual settlement while gesture dismissal is active", () => {
		const hydrated = hydrate(
			createBuiltState({
				gesture: createGestureStore({ dismissing: 1 }),
			}),
		);

		expect(hydrated.animating).toBe(0);
		expect(hydrated.settled).toBe(1);
		expect(hydrated.logicallySettled).toBe(1);
	});

	it("uses the progress animation settle signal", () => {
		const state = createBuiltState({
			progress: 1,
			targetProgress: 1,
			progressSettled: 0,
		});

		expect(hydrate(state).settled).toBe(0);
		expect(hydrate(state).logicallySettled).toBe(0);

		state.progressSettled.set(1);
		expect(hydrate(state).settled).toBe(1);
		expect(hydrate(state).logicallySettled).toBe(1);
	});

	it("allows visual settlement before the progress animation fully finishes", () => {
		const state = createBuiltState({
			progress: 1,
			progressAnimating: 1,
			targetProgress: 1,
			progressSettled: 1,
		});

		const hydrated = hydrate(state);

		expect(hydrated.animating).toBe(1);
		expect(hydrated.settled).toBe(1);
		expect(hydrated.logicallySettled).toBe(1);
	});

	it("keeps settled false until the progress animation reports settlement", () => {
		const state = createBuiltState({
			progress: 0.99,
			progressAnimating: 1,
			targetProgress: 1,
			progressSettled: 0,
		});

		expect(hydrate(state).settled).toBe(0);
		expect(hydrate(state).logicallySettled).toBe(0);
	});

	it("keeps settled false while dragging", () => {
		const state = createBuiltState({
			progress: 1,
			targetProgress: 1,
			progressSettled: 1,
			gesture: createGestureStore({ dragging: 1 }),
		});

		const hydrated = hydrate(state);

		expect(hydrated.animating).toBe(1);
		expect(hydrated.settled).toBe(0);
		expect(hydrated.logicallySettled).toBe(0);
	});

	it("allows visual settlement while a dismissing gesture holds residual values", () => {
		const state = createBuiltState({
			progress: 0,
			targetProgress: 0,
			closing: 1,
			progressSettled: 1,
			gesture: createGestureStore({
				dismissing: 1,
				normY: 0.4,
			}),
		});

		const hydrated = hydrate(state);

		expect(hydrated.animating).toBe(0);
		expect(hydrated.settled).toBe(1);
		expect(hydrated.logicallySettled).toBe(1);
	});

	it("derives effective progress from gestures in progress-driven mode", () => {
		const state = createBuiltState({
			progress: 1,
			gesture: createGestureStore({ normY: 0.25 }),
			options: {
				gestureDirection: "vertical",
				gestureProgressMode: "progress-driven",
			},
		});
		const hydrated = hydrate(state);

		expect(hydrated.progress).toBe(0.75);
		expect(state.effectiveProgress.get()).toBe(0.75);
	});

	it("ignores pan gesture progress outside the configured direction", () => {
		const hydrated = hydrate(
			createBuiltState({
				progress: 1,
				gesture: createGestureStore({ normX: 0.25 }),
				options: {
					gestureDirection: "vertical",
					gestureProgressMode: "progress-driven",
				},
			}),
		);

		expect(hydrated.progress).toBe(1);
	});

	it("keeps base progress when gestureProgressMode is freeform", () => {
		const state = createBuiltState({
			progress: 1,
			gesture: createGestureStore({ normY: 0.25 }),
			options: {
				gestureDirection: "vertical",
				gestureProgressMode: "progress-driven",
			},
		});
		const hydrated = hydrate(state, {
			gestureDirection: "vertical",
			gestureProgressMode: "freeform",
		});

		expect(hydrated.progress).toBe(1);
		expect(state.effectiveProgress.get()).toBe(1);
	});

	it("clamps snap gesture progress to the minimum snap point when dismiss is disabled", () => {
		const state = createBuiltState({
			progress: 0.3,
			gesture: createGestureStore({ active: "vertical", normY: 0.25 }),
			options: {
				gestureEnabled: false,
				gestureDirection: "vertical",
				gestureProgressMode: "progress-driven",
			},
			sortedNumericSnapPoints: [0.3, 0.6, 1],
		});
		const hydrated = hydrate(state);

		expect(hydrated.progress).toBe(0.3);
		expect(state.effectiveProgress.get()).toBe(0.3);
	});

	it("allows snap gesture progress below the minimum snap point when dismiss is enabled", () => {
		const state = createBuiltState({
			progress: 0.3,
			gesture: createGestureStore({ active: "vertical", normY: 0.25 }),
			options: {
				gestureEnabled: true,
				gestureDirection: "vertical",
				gestureProgressMode: "progress-driven",
			},
			sortedNumericSnapPoints: [0.3, 0.6, 1],
		});
		const hydrated = hydrate(state);

		expect(hydrated.progress).toBeCloseTo(0.05);
		expect(state.effectiveProgress.get()).toBeCloseTo(0.05);
	});

	it("keeps legacy gestureDrivesProgress as a compatibility alias", () => {
		const hydrated = hydrate(
			createBuiltState({
				progress: 1,
				gesture: createGestureStore({ normY: 0.25 }),
				options: {
					gestureDirection: "vertical",
					gestureDrivesProgress: false,
				},
			}),
		);

		expect(hydrated.progress).toBe(1);
	});
});
