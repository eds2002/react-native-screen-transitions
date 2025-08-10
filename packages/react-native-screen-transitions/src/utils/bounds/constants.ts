import type { ScaledSize } from "react-native";
import type { MeasuredDimensions } from "react-native-reanimated";
import type { Complete } from "src/types/utils";
import type { BoundsBuilderOptions } from "./_types/builder";

export const FULLSCREEN_DIMENSIONS = (
	dimensions: ScaledSize,
): MeasuredDimensions => {
	"worklet";
	return {
		x: 0,
		y: 0,
		pageX: 0,
		pageY: 0,
		width: dimensions.width,
		height: dimensions.height,
	};
};

export const DEFAULT_BUILDER_OPTIONS: Complete<BoundsBuilderOptions> =
	Object.freeze({
		gestures: { x: 0, y: 0 },
		toFullscreen: false,
		absolute: false,
		relative: true,
		method: "transform",
		contentScaleMode: "auto",
	});
