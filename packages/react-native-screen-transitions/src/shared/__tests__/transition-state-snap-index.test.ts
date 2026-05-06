import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import {
	createScreenTransitionState,
	DEFAULT_SCREEN_TRANSITION_OPTIONS,
} from "../constants";
import type { GestureStoreMap } from "../stores/gesture.store";
import { buildScreenTransitionOptions } from "../providers/screen/animation/helpers/build-screen-transition-options";
import { hydrateTransitionState } from "../providers/screen/animation/helpers/hydrate-transition-state";

const shared = <T>(initial: T): SharedValue<T> => {
	let value = initial;
	return {
		get: () => value,
		set: (next: T) => {
			value = next;
		},
		value,
	} as SharedValue<T>;
};

const createGestureStore = (): GestureStoreMap => ({
	x: shared(0),
	y: shared(0),
	normX: shared(0),
	normY: shared(0),
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
	dismissing: shared(0),
	dragging: shared(0),
	direction: shared(null),
	normalizedX: shared(0),
	normalizedY: shared(0),
	isDismissing: shared(0),
	isDragging: shared(0),
});

describe("hydrateTransitionState snap indices", () => {
	it("hydrates the expanded screen transition options subset", () => {
		const options = buildScreenTransitionOptions({
			gestureEnabled: false,
			experimental_allowDisabledGestureTracking: true,
			gestureDirection: ["vertical", "pinch-out"],
			gestureSensitivity: 0.6,
			gestureVelocityImpact: 0.45,
			gestureSnapVelocityImpact: 0.2,
			gestureReleaseVelocityScale: 1.4,
			gestureReleaseVelocityMax: 9,
			gestureResponseDistance: 38,
			gestureDrivesProgress: false,
			gestureActivationArea: { left: "edge", top: "screen" },
			gestureSnapLocked: true,
			sheetScrollGestureBehavior: "collapse-only",
			backdropBehavior: "dismiss",
		});
		const state = createScreenTransitionState(
			{
				key: "route-a",
				name: "RouteA",
			},
			undefined,
			false,
			options,
		);

		const hydrated = hydrateTransitionState(
			{
				progress: shared(1),
				willAnimate: shared(0),
				closing: shared(0),
				animating: shared(0),
				entering: shared(0),
				settled: shared(1),
				logicallySettled: shared(1),
				gesture: createGestureStore(),
				route: state.route,
				options,
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

		expect(hydrated.options).toEqual({
			gestureEnabled: false,
			experimental_allowDisabledGestureTracking: true,
			gestureDirection: ["vertical", "pinch-out"],
			gestureSensitivity: 0.6,
			gestureVelocityImpact: 0.45,
			gestureSnapVelocityImpact: 0.2,
			gestureReleaseVelocityScale: 1.4,
			gestureResponseDistance: 38,
			gestureDrivesProgress: false,
			gestureActivationArea: { left: "edge", top: "screen" },
			gestureSnapLocked: true,
			sheetScrollGestureBehavior: "collapse-only",
			backdropBehavior: "dismiss",
		});
		expect("gestureReleaseVelocityMax" in hydrated.options).toBe(false);
	});

	it("canonicalizes deprecated sheet scroll behavior aliases", () => {
		expect(
			buildScreenTransitionOptions({
				expandViaScrollView: true,
			}).sheetScrollGestureBehavior,
		).toBe("expand-and-collapse");
		expect(
			buildScreenTransitionOptions({
				expandViaScrollView: false,
			}).sheetScrollGestureBehavior,
		).toBe("collapse-only");
		expect(buildScreenTransitionOptions({}).sheetScrollGestureBehavior).toBe(
			undefined,
		);
	});

	it("keeps animatedSnapIndex fractional while snapIndex follows the target index", () => {
		const state = createScreenTransitionState({
			key: "route-a",
			name: "RouteA",
		});

		const hydrated = hydrateTransitionState(
			{
				progress: shared(0.5),
				willAnimate: shared(0),
				closing: shared(0),
				animating: shared(0),
				entering: shared(0),
				settled: shared(1),
				logicallySettled: shared(1),
				gesture: createGestureStore(),
				route: state.route,
				options: DEFAULT_SCREEN_TRANSITION_OPTIONS,
				navigationMaskEnabled: false,
				targetProgress: shared(0.8),
				resolvedAutoSnapPoint: shared(-1),
				measuredContentLayout: shared(null),
				contentLayoutSlot: { width: 0, height: 0 },
				hasAutoSnapPoint: false,
				sortedNumericSnapPoints: [0.2, 0.8],
				unwrapped: state,
			},
			{ width: 390, height: 844 },
		);

		expect(hydrated.animatedSnapIndex).toBeCloseTo(0.5);
		expect(hydrated.snapIndex).toBe(1);
	});

	it("merges the resolved auto snap point without changing snap index ordering", () => {
		const state = createScreenTransitionState({
			key: "route-a",
			name: "RouteA",
		});

		const hydrated = hydrateTransitionState(
			{
				progress: shared(0.45),
				willAnimate: shared(0),
				closing: shared(0),
				animating: shared(0),
				entering: shared(0),
				settled: shared(1),
				logicallySettled: shared(1),
				gesture: createGestureStore(),
				route: state.route,
				options: DEFAULT_SCREEN_TRANSITION_OPTIONS,
				navigationMaskEnabled: false,
				targetProgress: shared(0.45),
				resolvedAutoSnapPoint: shared(0.45),
				measuredContentLayout: shared(null),
				contentLayoutSlot: { width: 0, height: 0 },
				hasAutoSnapPoint: true,
				sortedNumericSnapPoints: [0.2, 0.8],
				unwrapped: state,
			},
			{ width: 390, height: 844 },
		);

		expect(hydrated.animatedSnapIndex).toBe(1);
		expect(hydrated.snapIndex).toBe(1);
	});

	it("reuses the measured content layout slot across hydration frames", () => {
		const state = createScreenTransitionState({
			key: "route-a",
			name: "RouteA",
		});
		const measuredContentLayout = shared({ width: 320, height: 400 });
		const builtState = {
			progress: shared(0.45),
			willAnimate: shared(0),
			closing: shared(0),
			animating: shared(0),
			entering: shared(0),
			settled: shared(1),
			logicallySettled: shared(1),
			gesture: createGestureStore(),
			route: state.route,
			options: DEFAULT_SCREEN_TRANSITION_OPTIONS,
			navigationMaskEnabled: false,
			targetProgress: shared(0.45),
			resolvedAutoSnapPoint: shared(0.45),
			measuredContentLayout,
			contentLayoutSlot: { width: 0, height: 0 },
			hasAutoSnapPoint: true,
			sortedNumericSnapPoints: [0.2, 0.8],
			unwrapped: state,
		};

		const firstHydration = hydrateTransitionState(builtState, {
			width: 390,
			height: 844,
		});
		const firstContent = firstHydration.layouts.content;

		measuredContentLayout.set({ width: 300, height: 360 });

		const secondHydration = hydrateTransitionState(builtState, {
			width: 390,
			height: 844,
		});

		expect(secondHydration.layouts.content).toBe(firstContent);
		expect(secondHydration.layouts.content).toEqual({
			width: 300,
			height: 360,
		});
	});
});
