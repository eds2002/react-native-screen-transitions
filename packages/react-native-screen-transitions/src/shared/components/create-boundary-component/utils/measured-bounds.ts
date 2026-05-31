import type { View } from "react-native";
import {
	type AnimatedRef,
	type MeasuredDimensions,
	measure,
} from "react-native-reanimated";
import type {
	ScrollGestureAxisState,
	ScrollGestureState,
} from "../../../types/gesture.types";

const SCROLL_MEASUREMENT_EPSILON = 1;

const getOverscrollDelta = (axisState: ScrollGestureAxisState): number => {
	"worklet";
	const maxOffset = Math.max(0, axisState.contentSize - axisState.layoutSize);
	const clampedOffset = Math.min(Math.max(axisState.offset, 0), maxOffset);
	const delta = axisState.offset - clampedOffset;

	return Math.abs(delta) > SCROLL_MEASUREMENT_EPSILON ? delta : 0;
};

export const adjustedMeasuredBoundsForOverscrollDeltas = (
	measured: MeasuredDimensions,
	scrollState: ScrollGestureState | null,
): MeasuredDimensions => {
	"worklet";

	if (!scrollState) {
		return measured;
	}

	const deltaX = getOverscrollDelta(scrollState.horizontal);
	const deltaY = getOverscrollDelta(scrollState.vertical);

	if (deltaX === 0 && deltaY === 0) {
		return measured;
	}

	return {
		...measured,
		x: measured.x + deltaX,
		y: measured.y + deltaY,
		pageX: measured.pageX + deltaX,
		pageY: measured.pageY + deltaY,
	};
};

export const isMeasurementInViewport = (
	measured: MeasuredDimensions,
	viewportWidth: number,
	viewportHeight: number,
): boolean => {
	"worklet";

	if (measured.width <= 0 || measured.height <= 0) {
		return false;
	}

	const toleranceX = viewportWidth * 0.15;
	const toleranceY = viewportHeight * 0.15;
	const centerX = measured.pageX + measured.width / 2;
	const centerY = measured.pageY + measured.height / 2;

	return (
		centerX >= -toleranceX &&
		centerX <= viewportWidth + toleranceX &&
		centerY >= -toleranceY &&
		centerY <= viewportHeight + toleranceY
	);
};

export const measureWithOverscrollAwareness = (
	ref: AnimatedRef<View>,
	scrollState: ScrollGestureState | null,
): MeasuredDimensions | null => {
	"worklet";
	const measured = measure(ref);
	if (!measured) return null;

	return adjustedMeasuredBoundsForOverscrollDeltas(measured, scrollState);
};
