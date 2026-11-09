import type { View } from "react-native";
import {
	type AnimatedRef,
	type MeasuredDimensions,
	measure,
} from "react-native-reanimated";
import {
	clampScrollAxisOffset,
	cloneScrollMetadataState,
	snapshotScrollChain,
} from "../../../stores/scroll.store";
import type {
	ScrollChainSnapshot,
	ScrollGestureAxis,
	ScrollGestureAxisState,
	ScrollGestureState,
	ScrollMetadataState,
} from "../../../types/gesture.types";

const SCROLL_MEASUREMENT_EPSILON = 1;

export type ScrollMeasuredDimensions = MeasuredDimensions & {
	scroll?: ScrollMetadataState | null;
	/** The scrollables around the boundary and their offsets when it was measured. */
	scrollChain?: ScrollChainSnapshot[];
};

const getOverscrollDelta = (
	axisState: ScrollGestureAxisState | null | undefined,
): number => {
	"worklet";
	const clampedOffset = clampScrollAxisOffset(axisState);
	if (!axisState || clampedOffset === null) {
		return 0;
	}

	const delta = axisState.offset - clampedOffset;

	return Math.abs(delta) > SCROLL_MEASUREMENT_EPSILON ? delta : 0;
};

const adjustedMeasuredBoundsForOverscrollDeltas = (
	measured: MeasuredDimensions,
	scrollState: ScrollGestureState | ScrollMetadataState | null,
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

/**
 * A screen drawn smaller than this (a transition that grows it from nothing, at its first frames)
 * gives boxes that small: they cannot be scaled back to its layout, so they are not recorded and
 * the screen is measured again once it is drawn.
 */
const MIN_MEASURABLE_SCREEN_SCALE = 0.05;

/** Whether a view as wide as the screen measured `measuredWidth` wide: its screen is drawn too small. */
export const isScreenDrawnTooSmall = (
	measuredWidth: number,
	viewportWidth: number,
) => {
	"worklet";
	return measuredWidth < viewportWidth * MIN_MEASURABLE_SCREEN_SCALE;
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

export const correctMeasuredBoundsForVisibilityGate = ({
	measured,
	isScreenReady,
	visibilityBlockOffset,
	viewportWidth,
	viewportHeight,
}: {
	measured: MeasuredDimensions;
	isScreenReady: boolean;
	visibilityBlockOffset: number;
	viewportWidth: number;
	viewportHeight: number;
}): MeasuredDimensions => {
	"worklet";

	if (
		isScreenReady ||
		visibilityBlockOffset <= 0 ||
		isMeasurementInViewport(measured, viewportWidth, viewportHeight)
	) {
		return measured;
	}

	// A destination can still carry the internal visibility transform for one
	// native frame. Correct only that known offset and preserve all other
	// presentation transforms in the measured coordinates.
	const visibilityOffsetApplied = {
		...measured,
		pageY: measured.pageY - visibilityBlockOffset,
	};
	if (
		isMeasurementInViewport(
			visibilityOffsetApplied,
			viewportWidth,
			viewportHeight,
		)
	) {
		return visibilityOffsetApplied;
	}

	const inverseVisibilityOffsetApplied = {
		...measured,
		pageY: measured.pageY + visibilityBlockOffset,
	};
	if (
		isMeasurementInViewport(
			inverseVisibilityOffsetApplied,
			viewportWidth,
			viewportHeight,
		)
	) {
		return inverseVisibilityOffsetApplied;
	}

	return measured;
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

export const attachScrollSnapshotToMeasuredBounds = (
	measured: MeasuredDimensions,
	scroll: ScrollMetadataState | null | undefined,
	scrollChain: readonly { id: string; axis: ScrollGestureAxis }[] = [],
): ScrollMeasuredDimensions => {
	"worklet";

	return {
		...measured,
		scroll: cloneScrollMetadataState(scroll),
		scrollChain: snapshotScrollChain(scroll, scrollChain),
	};
};
