import {
	Extrapolation,
	interpolate,
	type MeasuredDimensions,
	type StyleProps,
} from "react-native-reanimated";
import { VISIBLE_STYLE } from "../../../../constants";
import type {
	ContentTransformGeometry,
	RelativeGeometry,
} from "../../types/geometry";
import type { BoundsAnchor, BoundsOptions } from "../../types/options";

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
	computeOptions: BoundsOptions;
};

/**
 * Screen-level content transform params.
 * - start/end: absolute window bounds for the paired target and the current
 *   screen-owned bound
 * - geometry: precomputed screen-level tx/ty/scale plus ranges/entering
 * - interp: function to interpolate between numbers using the correct progress range
 */
type ContentComposeParams = {
	start: MeasuredDimensions;
	end: MeasuredDimensions;
	geometry: ContentTransformGeometry;
	progress: number;
	ranges: readonly [number, number];
	computeOptions: BoundsOptions;
};

const getAnchorPoint = (
	bounds: MeasuredDimensions,
	anchor: BoundsAnchor = "center",
): { x: number; y: number } => {
	"worklet";

	const { pageX, pageY, width, height } = bounds;

	switch (anchor) {
		case "topLeading":
			return { x: pageX, y: pageY };
		case "top":
			return { x: pageX + width / 2, y: pageY };
		case "topTrailing":
			return { x: pageX + width, y: pageY };
		case "leading":
			return { x: pageX, y: pageY + height / 2 };
		case "center":
			return { x: pageX + width / 2, y: pageY + height / 2 };
		case "trailing":
			return { x: pageX + width, y: pageY + height / 2 };
		case "bottomLeading":
			return { x: pageX, y: pageY + height };
		case "bottom":
			return { x: pageX + width / 2, y: pageY + height };
		case "bottomTrailing":
			return { x: pageX + width, y: pageY + height };
	}
};

const getAnchorOffset = ({
	width,
	height,
	anchor,
}: {
	width: number;
	height: number;
	anchor: BoundsAnchor;
}): { x: number; y: number } => {
	"worklet";

	switch (anchor) {
		case "topLeading":
			return { x: 0, y: 0 };
		case "top":
			return { x: width / 2, y: 0 };
		case "topTrailing":
			return { x: width, y: 0 };
		case "leading":
			return { x: 0, y: height / 2 };
		case "center":
			return { x: width / 2, y: height / 2 };
		case "trailing":
			return { x: width, y: height / 2 };
		case "bottomLeading":
			return { x: 0, y: height };
		case "bottom":
			return { x: width / 2, y: height };
		case "bottomTrailing":
			return { x: width, y: height };
	}
};

export function composeSizeAbsolute(params: ElementComposeParams): StyleProps {
	"worklet";
	const { start, end, progress, ranges, computeOptions } = params;
	const anchor = computeOptions.anchor ?? "center";
	const startAnchor = getAnchorPoint(start, anchor);
	const endAnchor = getAnchorPoint(end, anchor);

	const width = interpolate(
		progress,
		ranges,
		[start.width, end.width],
		Extrapolation.CLAMP,
	);
	const height = interpolate(
		progress,
		ranges,
		[start.height, end.height],
		Extrapolation.CLAMP,
	);

	const anchorX = interpolate(
		progress,
		ranges,
		[startAnchor.x, endAnchor.x],
		Extrapolation.CLAMP,
	);
	const anchorY = interpolate(
		progress,
		ranges,
		[startAnchor.y, endAnchor.y],
		Extrapolation.CLAMP,
	);
	const anchorOffset = getAnchorOffset({ width, height, anchor });

	const translateX = anchorX - anchorOffset.x;
	const translateY = anchorY - anchorOffset.y;

	if (computeOptions.raw) {
		return {
			width,
			height,
			translateX,
			translateY,
			...VISIBLE_STYLE,
		};
	}

	return {
		width,
		height,
		transform: [{ translateX }, { translateY }],
		...VISIBLE_STYLE,
	};
}

export function composeSizeRelative(params: ElementComposeParams): StyleProps {
	"worklet";
	const { start, end, geometry, progress, ranges, computeOptions } = params;
	const anchor = computeOptions.anchor ?? "center";
	const startAnchor = getAnchorPoint(start, anchor);
	const endAnchor = getAnchorPoint(end, anchor);
	const baseX = geometry.entering ? end.pageX : start.pageX;
	const baseY = geometry.entering ? end.pageY : start.pageY;

	const width = interpolate(
		progress,
		ranges,
		[start.width, end.width],
		Extrapolation.CLAMP,
	);
	const height = interpolate(
		progress,
		ranges,
		[start.height, end.height],
		Extrapolation.CLAMP,
	);
	const anchorX = interpolate(
		progress,
		ranges,
		[startAnchor.x, endAnchor.x],
		Extrapolation.CLAMP,
	);
	const anchorY = interpolate(
		progress,
		ranges,
		[startAnchor.y, endAnchor.y],
		Extrapolation.CLAMP,
	);
	const anchorOffset = getAnchorOffset({ width, height, anchor });

	const translateX = anchorX - (baseX + anchorOffset.x);
	const translateY = anchorY - (baseY + anchorOffset.y);

	if (computeOptions.raw) {
		return {
			translateX,
			translateY,
			width,
			height,
			...VISIBLE_STYLE,
		};
	}

	return {
		transform: [{ translateX }, { translateY }],
		width,
		height,
		...VISIBLE_STYLE,
	};
}

export function composeTransformAbsolute(
	params: ElementComposeParams,
): StyleProps {
	"worklet";
	const { start, end, geometry, progress, ranges, computeOptions } = params;

	const translateX = geometry.entering
		? interpolate(
				progress,
				ranges,
				[start.pageX, end.pageX],
				Extrapolation.CLAMP,
			)
		: interpolate(
				progress,
				ranges,
				[end.pageX, start.pageX],
				Extrapolation.CLAMP,
			);
	const translateY = geometry.entering
		? interpolate(
				progress,
				ranges,
				[start.pageY, end.pageY],
				Extrapolation.CLAMP,
			)
		: interpolate(
				progress,
				ranges,
				[end.pageY, start.pageY],
				Extrapolation.CLAMP,
			);
	const scaleX = geometry.entering
		? interpolate(progress, ranges, [geometry.scaleX, 1], Extrapolation.CLAMP)
		: interpolate(
				progress,
				ranges,
				[1, 1 / geometry.scaleX],
				Extrapolation.CLAMP,
			);
	const scaleY = geometry.entering
		? interpolate(progress, ranges, [geometry.scaleY, 1], Extrapolation.CLAMP)
		: interpolate(
				progress,
				ranges,
				[1, 1 / geometry.scaleY],
				Extrapolation.CLAMP,
			);

	if (computeOptions.raw) {
		return {
			translateX,
			translateY,
			scaleX,
			scaleY,
			...VISIBLE_STYLE,
		};
	}

	return {
		transform: [{ translateX }, { translateY }, { scaleX }, { scaleY }],
		...VISIBLE_STYLE,
	};
}

export function composeTransformRelative(
	params: ElementComposeParams,
): StyleProps {
	"worklet";
	const { geometry, computeOptions, progress, ranges } = params;

	const translateX = geometry.entering
		? interpolate(progress, ranges, [geometry.dx, 0], Extrapolation.CLAMP)
		: interpolate(progress, ranges, [0, -geometry.dx], Extrapolation.CLAMP);
	const translateY = geometry.entering
		? interpolate(progress, ranges, [geometry.dy, 0], Extrapolation.CLAMP)
		: interpolate(progress, ranges, [0, -geometry.dy], Extrapolation.CLAMP);
	const scaleX = geometry.entering
		? interpolate(progress, ranges, [geometry.scaleX, 1], Extrapolation.CLAMP)
		: interpolate(
				progress,
				ranges,
				[1, 1 / geometry.scaleX],
				Extrapolation.CLAMP,
			);
	const scaleY = geometry.entering
		? interpolate(progress, ranges, [geometry.scaleY, 1], Extrapolation.CLAMP)
		: interpolate(
				progress,
				ranges,
				[1, 1 / geometry.scaleY],
				Extrapolation.CLAMP,
			);

	if (computeOptions.raw) {
		return {
			translateX,
			translateY,
			scaleX,
			scaleY,
			...VISIBLE_STYLE,
		};
	}

	const offsetX = computeOptions.offset?.x ?? computeOptions.gestures?.x ?? 0;
	const offsetY = computeOptions.offset?.y ?? computeOptions.gestures?.y ?? 0;

	return {
		transform: [
			{ translateX: offsetX },
			{ translateY: offsetY },
			{ translateX },
			{ translateY },
			{ scaleX },
			{ scaleY },
		],
		...VISIBLE_STYLE,
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
		? interpolate(progress, ranges, [tx, 0], Extrapolation.CLAMP)
		: interpolate(progress, ranges, [0, tx], Extrapolation.CLAMP);
	const translateY = entering
		? interpolate(progress, ranges, [ty, 0], Extrapolation.CLAMP)
		: interpolate(progress, ranges, [0, ty], Extrapolation.CLAMP);
	const scale = entering
		? interpolate(progress, ranges, [s, 1], Extrapolation.CLAMP)
		: interpolate(progress, ranges, [1, s], Extrapolation.CLAMP);

	if (raw) {
		return {
			translateX,
			translateY,
			scale,
			...VISIBLE_STYLE,
		};
	}

	return {
		transform: [{ translateX }, { translateY }, { scale }],
		...VISIBLE_STYLE,
	};
}
