import {
	interpolate,
	type MeasuredDimensions,
	type StyleProps,
} from "react-native-reanimated";
import type { BoundsBuilderOptions } from "../types/builder";
import type {
	ContentTransformGeometry,
	RelativeGeometry,
} from "../types/geometry";

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
	const { start, end, geometry, progress, ranges, computeOptions } = params;

	const width = geometry.entering
		? interpolate(progress, ranges, [start.width, end.width])
		: interpolate(progress, ranges, [end.width, start.width]);
	const height = geometry.entering
		? interpolate(progress, ranges, [start.height, end.height])
		: interpolate(progress, ranges, [end.height, start.height]);

	const translateX = geometry.entering
		? interpolate(progress, ranges, [start.pageX, end.pageX])
		: interpolate(progress, ranges, [end.pageX, start.pageX]);
	const translateY = geometry.entering
		? interpolate(progress, ranges, [start.pageY, end.pageY])
		: interpolate(progress, ranges, [end.pageY, start.pageY]);

	if (computeOptions.raw) {
		return {
			width,
			height,
			translateX,
			translateY,
		};
	}

	return {
		width,
		height,
		transform: [{ translateX }, { translateY }],
	};
}

export function composeSizeRelative(params: ElementComposeParams): StyleProps {
	"worklet";
	const { start, end, geometry, progress, ranges, computeOptions } = params;

	const translateX = geometry.entering
		? interpolate(progress, ranges, [geometry.dx, 0])
		: interpolate(progress, ranges, [0, -geometry.dx]);

	const translateY = geometry.entering
		? interpolate(progress, ranges, [geometry.dy, 0])
		: interpolate(progress, ranges, [0, -geometry.dy]);

	const width = geometry.entering
		? interpolate(progress, ranges, [start.width, end.width])
		: interpolate(progress, ranges, [end.width, start.width]);

	const height = geometry.entering
		? interpolate(progress, ranges, [start.height, end.height])
		: interpolate(progress, ranges, [end.height, start.height]);

	if (computeOptions.raw) {
		return {
			translateX,
			translateY,
			width,
			height,
		};
	}

	return {
		transform: [{ translateX }, { translateY }],
		width,
		height,
	};
}

export function composeTransformAbsolute(
	params: ElementComposeParams,
): StyleProps {
	"worklet";
	const { start, end, geometry, progress, ranges, computeOptions } = params;

	const translateX = geometry.entering
		? interpolate(progress, ranges, [start.pageX, end.pageX])
		: interpolate(progress, ranges, [end.pageX, start.pageX]);
	const translateY = geometry.entering
		? interpolate(progress, ranges, [start.pageY, end.pageY])
		: interpolate(progress, ranges, [end.pageY, start.pageY]);
	const scaleX = geometry.entering
		? interpolate(progress, ranges, [geometry.scaleX, 1])
		: interpolate(progress, ranges, [1, 1 / geometry.scaleX]);
	const scaleY = geometry.entering
		? interpolate(progress, ranges, [geometry.scaleY, 1])
		: interpolate(progress, ranges, [1, 1 / geometry.scaleY]);

	if (computeOptions.raw) {
		return {
			translateX,
			translateY,
			scaleX,
			scaleY,
		};
	}

	return {
		transform: [{ translateX }, { translateY }, { scaleX }, { scaleY }],
	};
}

export function composeTransformRelative(
	params: ElementComposeParams,
): StyleProps {
	"worklet";
	const { geometry, computeOptions, progress, ranges } = params;

	const translateX = geometry.entering
		? interpolate(progress, ranges, [geometry.dx, 0])
		: interpolate(progress, ranges, [0, -geometry.dx]);
	const translateY = geometry.entering
		? interpolate(progress, ranges, [geometry.dy, 0])
		: interpolate(progress, ranges, [0, -geometry.dy]);
	const scaleX = geometry.entering
		? interpolate(progress, ranges, [geometry.scaleX, 1])
		: interpolate(progress, ranges, [1, 1 / geometry.scaleX]);
	const scaleY = geometry.entering
		? interpolate(progress, ranges, [geometry.scaleY, 1])
		: interpolate(progress, ranges, [1, 1 / geometry.scaleY]);

	if (computeOptions.raw) {
		return {
			translateX,
			translateY,
			scaleX,
			scaleY,
		};
	}

	return {
		transform: [
			{ translateX: computeOptions.gestures?.x ?? 0 },
			{ translateY: computeOptions.gestures?.y ?? 0 },
			{ translateX },
			{ translateY },
			{ scaleX },
			{ scaleY },
		],
	};
}

export function composeContentStyle(params: ContentComposeParams): StyleProps {
	"worklet";
	const {
		geometry,
		progress,
		ranges,
		computeOptions: { raw },
	} = params;
	const { s, tx, ty, entering } = geometry;

	const translateX = entering
		? interpolate(progress, ranges, [tx, 0])
		: interpolate(progress, ranges, [0, tx]);
	const translateY = entering
		? interpolate(progress, ranges, [ty, 0])
		: interpolate(progress, ranges, [0, ty]);
	const scale = entering
		? interpolate(progress, ranges, [s, 1])
		: interpolate(progress, ranges, [1, s]);

	if (raw) {
		return {
			translateX,
			translateY,
			scale,
		};
	}

	return {
		transform: [{ translateX }, { translateY }, { scale }],
	};
}
