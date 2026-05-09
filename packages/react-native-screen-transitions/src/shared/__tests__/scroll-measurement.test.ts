import { describe, expect, it } from "bun:test";
import type { MeasuredDimensions } from "react-native-reanimated";
import { adjustedMeasuredBoundsForOverscrollDeltas } from "../components/create-boundary-component/hooks/helpers/scroll-measurement";
import type { ScrollGestureState } from "../types/gesture.types";

const measured = (): MeasuredDimensions => ({
	x: 20,
	y: 40,
	width: 100,
	height: 120,
	pageX: 20,
	pageY: 40,
});

const scrollState = (
	overrides: Partial<ScrollGestureState> = {},
): ScrollGestureState => ({
	vertical: { offset: 0, contentSize: 1000, layoutSize: 500 },
	horizontal: { offset: 0, contentSize: 1000, layoutSize: 500 },
	isTouched: true,
	...overrides,
});

describe("adjustedMeasuredBoundsForOverscrollDeltas", () => {
	it("returns the original measurement when no scroll state exists", () => {
		const raw = measured();

		expect(adjustedMeasuredBoundsForOverscrollDeltas(raw, null)).toBe(raw);
	});

	it("keeps measurements unchanged while scroll offset is in range", () => {
		const raw = measured();

		expect(
			adjustedMeasuredBoundsForOverscrollDeltas(
				raw,
				scrollState({
					vertical: { offset: 250, contentSize: 1000, layoutSize: 500 },
				}),
			),
		).toBe(raw);
	});

	it("removes top overscroll displacement from vertical measurements", () => {
		const raw = measured();

		expect(
			adjustedMeasuredBoundsForOverscrollDeltas(
				raw,
				scrollState({
					vertical: { offset: -30, contentSize: 1000, layoutSize: 500 },
				}),
			),
		).toEqual({
			...raw,
			y: 10,
			pageY: 10,
		});
	});

	it("removes end overscroll displacement from vertical measurements", () => {
		const raw = measured();

		expect(
			adjustedMeasuredBoundsForOverscrollDeltas(
				raw,
				scrollState({
					vertical: { offset: 530, contentSize: 1000, layoutSize: 500 },
				}),
			),
		).toEqual({
			...raw,
			y: 70,
			pageY: 70,
		});
	});

	it("removes horizontal overscroll displacement from horizontal measurements", () => {
		const raw = measured();

		expect(
			adjustedMeasuredBoundsForOverscrollDeltas(
				raw,
				scrollState({
					horizontal: { offset: -12, contentSize: 1000, layoutSize: 500 },
				}),
			),
		).toEqual({
			...raw,
			x: 8,
			pageX: 8,
		});
	});
});
