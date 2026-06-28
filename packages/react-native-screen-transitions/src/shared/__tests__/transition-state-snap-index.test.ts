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

const createGestureStore = (): GestureStoreMap => ({
	x: shared(0),
	y: shared(0),
	normX: shared(0),
	normY: shared(0),
	velocity: shared(0),
	scale: shared(1),
	normScale: shared(0),
	focalX: shared(0),
	focalY: shared(0),
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
	dismissing: shared(0),
	dragging: shared(0),
	settling: shared(0),
	active: shared(null),
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
			gestureTracking: "always",
			gestureDirection: ["vertical", "pinch-out"],
			gestureSensitivity: 0.6,
			gestureVelocityImpact: 0.45,
			gestureSnapVelocityImpact: 0.2,
			gestureReleaseVelocityScale: 1.4,
			gestureReleaseVelocityMax: 9,
			gestureResponseDistance: 38,
			gestureProgressMode: "freeform",
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
			options,
		);

		const hydrated = hydrateTransitionState(
			{
				transitionProgress: shared(1),
				visualProgress: shared(1),
				stackProgress: shared(1),
				willAnimate: shared(0),
				closing: shared(0),
				progressAnimating: shared(0),
				entering: shared(0),
				gesture: createGestureStore(),
				route: state.route,
				options,
				optionsSlot: {},
				targetProgress: shared(1),
				progressSettled: shared(1),
				resolvedAutoSnapPoint: shared(-1),
				measuredContentLayout: shared(null),
				scrollMetadata: shared(null),
				contentLayoutSlot: { width: 0, height: 0 },
				hasAutoSnapPoint: false,
				sortedNumericSnapPoints: [],
				unwrapped: state,
			},
			{ width: 390, height: 844 },
		);

		expect(hydrated.options).toEqual({
			navigationMaskEnabled: undefined,
			gestureEnabled: false,
			gestureTracking: "always",
			gestureDirection: ["vertical", "pinch-out"],
			gestureSensitivity: 0.6,
			gestureVelocityImpact: 0.45,
			gestureSnapVelocityImpact: 0.2,
			gestureReleaseVelocityScale: 1.4,
			gestureResponseDistance: 38,
			gestureProgressMode: "freeform",
			gestureDrivesProgress: false,
			gestureActivationArea: { left: "edge", top: "screen" },
			gestureSnapLocked: true,
			sheetScrollGestureBehavior: "collapse-only",
			backdropBehavior: "dismiss",
		});
		expect("gestureReleaseVelocityMax" in hydrated.options).toBe(false);
	});

	it("keeps static structural options while applying runtime option overrides", () => {
		const baseOptions = buildScreenTransitionOptions({
			navigationMaskEnabled: false,
			gestureTracking: "always",
			gestureSensitivity: 0.5,
		});
		const state = createScreenTransitionState(
			{
				key: "route-a",
				name: "RouteA",
			},
			undefined,
			baseOptions,
		);

		const hydrated = hydrateTransitionState(
			{
				transitionProgress: shared(1),
				visualProgress: shared(1),
				stackProgress: shared(1),
				willAnimate: shared(0),
				closing: shared(0),
				progressAnimating: shared(0),
				entering: shared(0),
				gesture: createGestureStore(),
				route: state.route,
				options: baseOptions,
				optionsSlot: {},
				targetProgress: shared(1),
				progressSettled: shared(1),
				resolvedAutoSnapPoint: shared(-1),
				measuredContentLayout: shared(null),
				scrollMetadata: shared(null),
				contentLayoutSlot: { width: 0, height: 0 },
				hasAutoSnapPoint: false,
				sortedNumericSnapPoints: [],
				unwrapped: state,
			},
			{ width: 390, height: 844 },
			{
				gestureProgressMode: "freeform",
				gestureTracking: "never",
			} as unknown as Parameters<typeof hydrateTransitionState>[2],
		);

		expect(hydrated.options.navigationMaskEnabled).toBe(false);
		expect(hydrated.options.gestureTracking).toBe("always");
		expect(hydrated.options.gestureSensitivity).toBe(0.5);
		expect(hydrated.options.gestureProgressMode).toBe("freeform");
		expect("navigationMaskEnabled" in hydrated.layouts).toBe(false);
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
					transitionProgress: shared(0.5),
					visualProgress: shared(0.5),
					stackProgress: shared(0.5),
				willAnimate: shared(0),
				closing: shared(0),
				progressAnimating: shared(0),
				entering: shared(0),
				gesture: createGestureStore(),
				route: state.route,
				options: DEFAULT_SCREEN_TRANSITION_OPTIONS,
				optionsSlot: {},
				targetProgress: shared(0.8),
				progressSettled: shared(1),
				resolvedAutoSnapPoint: shared(-1),
				measuredContentLayout: shared(null),
				scrollMetadata: shared(null),
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
					transitionProgress: shared(0.45),
					visualProgress: shared(0.45),
					stackProgress: shared(0.45),
				willAnimate: shared(0),
				closing: shared(0),
				progressAnimating: shared(0),
				entering: shared(0),
				gesture: createGestureStore(),
				route: state.route,
				options: DEFAULT_SCREEN_TRANSITION_OPTIONS,
				optionsSlot: {},
				targetProgress: shared(0.45),
				progressSettled: shared(1),
				resolvedAutoSnapPoint: shared(0.45),
				measuredContentLayout: shared(null),
				scrollMetadata: shared(null),
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
			transitionProgress: shared(0.45),
			visualProgress: shared(0.45),
			stackProgress: shared(0.45),
			willAnimate: shared(0),
			closing: shared(0),
			progressAnimating: shared(0),
			entering: shared(0),
			gesture: createGestureStore(),
			route: state.route,
			options: DEFAULT_SCREEN_TRANSITION_OPTIONS,
			optionsSlot: {},
			targetProgress: shared(0.45),
			progressSettled: shared(1),
			resolvedAutoSnapPoint: shared(0.45),
			measuredContentLayout,
			scrollMetadata: shared(null),
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

	it("exposes scroll metadata through layouts", () => {
		const state = createScreenTransitionState({
			key: "route-a",
			name: "RouteA",
		});
		const scrollMetadata = {
			vertical: {
				offset: 24,
				contentSize: 1200,
				layoutSize: 800,
				isTouched: true,
			},
			horizontal: null,
		};
			const builtState = {
				transitionProgress: shared(1),
				visualProgress: shared(1),
				stackProgress: shared(1),
			willAnimate: shared(0),
			closing: shared(0),
			progressAnimating: shared(0),
			entering: shared(0),
			gesture: createGestureStore(),
			route: state.route,
			options: DEFAULT_SCREEN_TRANSITION_OPTIONS,
			optionsSlot: {},
			targetProgress: shared(1),
			progressSettled: shared(1),
			resolvedAutoSnapPoint: shared(-1),
			measuredContentLayout: shared(null),
			scrollMetadata: shared(scrollMetadata),
			contentLayoutSlot: { width: 0, height: 0 },
			hasAutoSnapPoint: false,
			sortedNumericSnapPoints: [],
			unwrapped: state,
		};

		const hydrated = hydrateTransitionState(builtState, {
			width: 390,
			height: 844,
		});

		expect(hydrated.layouts.scroll).toBe(scrollMetadata);

		builtState.scrollMetadata.set(null);

		expect(
			hydrateTransitionState(builtState, {
				width: 390,
				height: 844,
			}).layouts.scroll,
		).toBeUndefined();
	});
});
