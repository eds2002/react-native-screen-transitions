import type { MeasuredDimensions } from "react-native-reanimated";

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
