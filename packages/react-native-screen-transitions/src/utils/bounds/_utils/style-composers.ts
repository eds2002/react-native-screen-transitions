import {
	interpolate,
	type MeasuredDimensions,
	type StyleProps,
} from "react-native-reanimated";
import type { BoundsBuilderOptions } from "../_types/builder";
import type {
	ContentTransformGeometry,
	RelativeGeometry,
} from "../_types/geometry";

/**
 * Common interpolation helper signature used by composers.
 * It maps from a -> b over the already-determined progress range.
 */
export type Interp = (a: number, b: number) => number;

/**
 * Element-level (relative) params shared by size/transform composers.
 * - start/end: absolute window bounds of the element in previous/next phases
 * - geometry: relative deltas and scales between start/end (dx, dy, scaleX, scaleY, ...)
 * - interp: function to interpolate between numbers using the correct progress range
 */
export type ElementComposeParams = {
	start: MeasuredDimensions;
	end: MeasuredDimensions;
	geometry: RelativeGeometry;
	progress: number;
	ranges: readonly [number, number];
	computeOptions: BoundsBuilderOptions;
};

/**
 * Screen-level content transform params (for aligning destination bound to source).
 * - start/end: absolute window bounds for the shared id (source/destination)
 * - geometry: precomputed screen-level tx/ty/sx/sy plus ranges/entering
 * - interp: function to interpolate between numbers using the correct progress range
 */
export type ContentComposeParams = {
	start: MeasuredDimensions;
	end: MeasuredDimensions;
	geometry: ContentTransformGeometry;
	progress: number;
	ranges: readonly [number, number];
	computeOptions: BoundsBuilderOptions;
};

export function composeSizeAbsolute(params: ElementComposeParams): StyleProps {
	"worklet";
	const { start, end, geometry, progress, ranges } = params;

	if (geometry.entering) {
		return {
			width: interpolate(progress, ranges, [start.width, end.width]),
			height: interpolate(progress, ranges, [start.height, end.height]),
			transform: [
				{ translateX: interpolate(progress, ranges, [start.pageX, end.pageX]) },
				{ translateY: interpolate(progress, ranges, [start.pageY, end.pageY]) },
			],
		} satisfies StyleProps;
	}

	return {
		width: interpolate(progress, ranges, [end.width, start.width]),
		height: interpolate(progress, ranges, [end.height, start.height]),
		transform: [
			{ translateX: interpolate(progress, ranges, [end.pageX, start.pageX]) },
			{ translateY: interpolate(progress, ranges, [end.pageY, start.pageY]) },
		],
	};
}

export function composeSizeRelative(params: ElementComposeParams): StyleProps {
	"worklet";
	const { start, end, geometry, progress, ranges } = params;

	if (geometry.entering) {
		return {
			transform: [
				{ translateX: interpolate(progress, ranges, [geometry.dx, 0]) },
				{ translateY: interpolate(progress, ranges, [geometry.dy, 0]) },
			],
			width: interpolate(progress, ranges, [start.width, end.width]),
			height: interpolate(progress, ranges, [start.height, end.height]),
		};
	}

	return {
		transform: [
			{ translateX: interpolate(progress, ranges, [0, -geometry.dx]) },
			{ translateY: interpolate(progress, ranges, [0, -geometry.dy]) },
		],
		width: interpolate(progress, ranges, [end.width, start.width]),
		height: interpolate(progress, ranges, [end.height, start.height]),
	};
}

export function composeTransformAbsolute(
	params: ElementComposeParams,
): StyleProps {
	"worklet";
	const { start, end, geometry, progress, ranges } = params;

	if (geometry.entering) {
		return {
			transform: [
				{ translateX: interpolate(progress, ranges, [start.pageX, end.pageX]) },
				{ translateY: interpolate(progress, ranges, [start.pageY, end.pageY]) },
				{ scaleX: interpolate(progress, ranges, [geometry.scaleX, 1]) },
				{ scaleY: interpolate(progress, ranges, [geometry.scaleY, 1]) },
			],
		};
	}

	return {
		transform: [
			{ translateX: interpolate(progress, ranges, [end.pageX, start.pageX]) },
			{ translateY: interpolate(progress, ranges, [end.pageY, start.pageY]) },
			{ scaleX: interpolate(progress, ranges, [1, 1 / geometry.scaleX]) },
			{ scaleY: interpolate(progress, ranges, [1, 1 / geometry.scaleY]) },
		],
	};
}

export function composeTransformRelative(
	params: ElementComposeParams,
): StyleProps {
	"worklet";
	const { geometry, computeOptions, progress, ranges } = params;

	if (geometry.entering) {
		return {
			transform: [
				{ translateX: computeOptions.gestures?.x ?? 0 },
				{ translateY: computeOptions.gestures?.y ?? 0 },
				{ translateX: interpolate(progress, ranges, [geometry.dx, 0]) },
				{ translateY: interpolate(progress, ranges, [geometry.dy, 0]) },
				{ scaleX: interpolate(progress, ranges, [geometry.scaleX, 1]) },
				{ scaleY: interpolate(progress, ranges, [geometry.scaleY, 1]) },
			],
		};
	}

	return {
		transform: [
			{ translateX: computeOptions.gestures?.x ?? 0 },
			{ translateY: computeOptions.gestures?.y ?? 0 },
			{ translateX: interpolate(progress, ranges, [0, -geometry.dx]) },
			{ translateY: interpolate(progress, ranges, [0, -geometry.dy]) },
			{ scaleX: interpolate(progress, ranges, [1, 1 / geometry.scaleX]) },
			{ scaleY: interpolate(progress, ranges, [1, 1 / geometry.scaleY]) },
		],
	};
}

export function composeContentStyle(params: ContentComposeParams): StyleProps {
	"worklet";
	const { geometry, progress, ranges } = params;
	const { s, tx, ty, entering } = geometry;

	if (entering) {
		return {
			transform: [
				{ translateX: interpolate(progress, ranges, [tx, 0]) },
				{ translateY: interpolate(progress, ranges, [ty, 0]) },
				{ scale: interpolate(progress, ranges, [s, 1]) },
			],
		};
	}

	return {
		transform: [
			{ translateX: interpolate(progress, ranges, [0, tx]) },
			{ translateY: interpolate(progress, ranges, [0, ty]) },
			{ scale: interpolate(progress, ranges, [1, s]) },
		],
	};
}
