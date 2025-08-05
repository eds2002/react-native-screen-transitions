import type { ScaledSize } from "react-native";
import type { MeasuredDimensions } from "react-native-reanimated";

export const FULLSCREEN_DIMENSIONS = (
	dimensions: ScaledSize,
): MeasuredDimensions => ({
	x: 0,
	y: 0,
	pageX: 0,
	pageY: 0,
	width: dimensions.width,
	height: dimensions.height,
});
