import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import { createScreenTransitionState } from "../constants";
import type { GestureStoreMap } from "../stores/gesture.store";
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
				targetProgress: shared(0.8),
				resolvedAutoSnapPoint: shared(-1),
				measuredContentLayout: shared(null),
				hasAutoSnapPoint: false,
				sortedNumericSnapPoints: [0.2, 0.8],
				unwrapped: state,
			},
			{ width: 390, height: 844 },
		);

		expect(hydrated.animatedSnapIndex).toBeCloseTo(0.5);
		expect(hydrated.snapIndex).toBe(1);
	});
});
