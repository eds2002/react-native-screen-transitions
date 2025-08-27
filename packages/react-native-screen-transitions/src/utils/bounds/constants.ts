import type { ScaledSize } from "react-native";
import type { MeasuredDimensions } from "react-native-reanimated";
import type { Complete } from "../../types/utils";
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
		space: "relative",
		target: "bound",
		/**
		 * Controls how elements scale during transitions
		 * - "match": Scale to match destination bounds (default for center anchor)
		 * - "none": No scaling, maintain original size (default for non-center anchors)
		 * - "uniform": Scale uniformly (maintain aspect ratio)
		 */
		scaleMode: "match",
		anchor: "center",
		raw: false,
	} as const);
