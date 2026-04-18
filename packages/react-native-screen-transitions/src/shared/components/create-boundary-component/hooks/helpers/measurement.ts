import type { MeasuredDimensions } from "react-native-reanimated";

export const SNAPSHOT_EPSILON = 0.5;

export const areMeasurementsEqual = (
	a: MeasuredDimensions,
	b: MeasuredDimensions,
): boolean => {
	"worklet";

	return (
		Math.abs(a.x - b.x) <= SNAPSHOT_EPSILON &&
		Math.abs(a.y - b.y) <= SNAPSHOT_EPSILON &&
		Math.abs(a.pageX - b.pageX) <= SNAPSHOT_EPSILON &&
		Math.abs(a.pageY - b.pageY) <= SNAPSHOT_EPSILON &&
		Math.abs(a.width - b.width) <= SNAPSHOT_EPSILON &&
		Math.abs(a.height - b.height) <= SNAPSHOT_EPSILON
	);
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
