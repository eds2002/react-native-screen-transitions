import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type { BoundsBuilderOptions } from "./_types/builder";
import type {
	ContentTransformGeometry,
	RelativeGeometry,
} from "./_types/geometry";

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
	interp: Interp;
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
	interp: Interp;
	computeOptions: BoundsBuilderOptions;
};

export function composeSizeAbsolute(params: ElementComposeParams): StyleProps {
	"worklet";
	const { start, end, geometry, interp } = params;

	if (geometry.entering) {
		return {
			width: interp(start.width, end.width),
			height: interp(start.height, end.height),
			transform: [
				{ translateX: interp(start.pageX, end.pageX) },
				{ translateY: interp(start.pageY, end.pageY) },
			],
		} satisfies StyleProps;
	}

	return {
		width: interp(end.width, start.width),
		height: interp(end.height, start.height),
		transform: [
			{ translateX: interp(end.pageX, start.pageX) },
			{ translateY: interp(end.pageY, start.pageY) },
		],
	};
}

export function composeSizeRelative(params: ElementComposeParams): StyleProps {
	"worklet";
	const { start, end, geometry, interp } = params;

	if (geometry.entering) {
		return {
			transform: [
				{ translateX: interp(geometry.dx, 0) },
				{ translateY: interp(geometry.dy, 0) },
			],
			width: interp(start.width, end.width),
			height: interp(start.height, end.height),
		};
	}

	return {
		transform: [
			{ translateX: interp(0, -geometry.dx) },
			{ translateY: interp(0, -geometry.dy) },
		],
		width: interp(end.width, start.width),
		height: interp(end.height, start.height),
	};
}

export function composeTransformAbsolute(
	params: ElementComposeParams,
): StyleProps {
	"worklet";
	const { start, end, geometry, interp } = params;

	if (geometry.entering) {
		return {
			transform: [
				{ translateX: interp(start.pageX, end.pageX) },
				{ translateY: interp(start.pageY, end.pageY) },
				{ scaleX: interp(geometry.scaleX, 1) },
				{ scaleY: interp(geometry.scaleY, 1) },
			],
		};
	}

	return {
		transform: [
			{ translateX: interp(end.pageX, start.pageX) },
			{ translateY: interp(end.pageY, start.pageY) },
			{ scaleX: interp(1, 1 / geometry.scaleX) },
			{ scaleY: interp(1, 1 / geometry.scaleY) },
		],
	};
}

export function composeTransformRelative(
	params: ElementComposeParams,
): StyleProps {
	"worklet";
	const { geometry, computeOptions, interp } = params;

	if (geometry.entering) {
		return {
			transform: [
				{ translateX: computeOptions.withGestures?.x ?? 0 },
				{ translateY: computeOptions.withGestures?.y ?? 0 },
				{ translateX: interp(geometry.dx, 0) },
				{ translateY: interp(geometry.dy, 0) },
				{ scaleX: interp(geometry.scaleX, 1) },
				{ scaleY: interp(geometry.scaleY, 1) },
			],
		};
	}

	return {
		transform: [
			{ translateX: computeOptions.withGestures?.x ?? 0 },
			{ translateY: computeOptions.withGestures?.y ?? 0 },
			{ translateX: interp(0, -geometry.dx) },
			{ translateY: interp(0, -geometry.dy) },
			{ scaleX: interp(1, 1 / geometry.scaleX) },
			{ scaleY: interp(1, 1 / geometry.scaleY) },
		],
	};
}

export function composeContentStyle(params: ContentComposeParams): StyleProps {
	"worklet";
	const { geometry, interp } = params;
	const { s, tx, ty, entering } = geometry;

	if (entering) {
		return {
			transform: [
				{ translateX: interp(tx, 0) },
				{ translateY: interp(ty, 0) },
				{ scale: interp(s, 1) },
			],
		};
	}

	return {
		transform: [
			{ translateX: interp(0, tx) },
			{ translateY: interp(0, ty) },
			{ scale: interp(1, s) },
		],
	};
}
