import {
	Extrapolation,
	interpolate,
	type MeasuredDimensions,
	type StyleProps,
} from "react-native-reanimated";
import { EPSILON, VISIBLE_STYLE } from "../../../../constants";
import type {
	ContentTransformGeometry,
	RelativeGeometry,
} from "../../types/geometry";
import type {
	BoundsAnchor,
	BoundsMotionTransform,
	BoundsOptions,
} from "../../types/options";

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

const clampUnit = (value: number) => {
	"worklet";
	return Math.min(1, Math.max(0, value));
};

const normalizeRangeProgress = (
	progress: number,
	ranges: readonly [number, number],
) => {
	"worklet";
	const distance = ranges[1] - ranges[0];

	if (Math.abs(distance) <= EPSILON) {
		return 1;
	}

	return clampUnit((progress - ranges[0]) / distance);
};

const getUniformScale = (scaleX: number, scaleY: number) => {
	"worklet";
	if (Math.abs(scaleX - scaleY) <= EPSILON) {
		return scaleX;
	}

	return Math.sqrt(Math.abs(scaleX * scaleY));
};

const getScaleRatio = (resolvedScale: number, currentScale: number) => {
	"worklet";
	const safeCurrentScale = Math.abs(currentScale) > EPSILON ? currentScale : 1;

	return resolvedScale / safeCurrentScale;
};

const resolveMotionTransform = ({
	computeOptions,
	progress,
	ranges,
	entering,
	start,
	end,
	from,
	to,
	current,
}: {
	computeOptions: BoundsOptions;
	progress: number;
	ranges: readonly [number, number];
	entering: boolean;
	start: MeasuredDimensions;
	end: MeasuredDimensions;
	from: BoundsMotionTransform;
	to: BoundsMotionTransform;
	current: BoundsMotionTransform;
}) => {
	"worklet";

	if (!computeOptions.motion) {
		return current;
	}

	return computeOptions.motion({
		progress: normalizeRangeProgress(progress, ranges),
		transitionProgress: progress,
		entering,
		from,
		to,
		current,
		start,
		end,
	});
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
	const startAnchorOffset = getAnchorOffset({
		width: start.width,
		height: start.height,
		anchor,
	});
	const endAnchorOffset = getAnchorOffset({
		width: end.width,
		height: end.height,
		anchor,
	});
	const motion = resolveMotionTransform({
		computeOptions,
		progress,
		ranges,
		entering: params.geometry.entering,
		start,
		end,
		from: {
			x: startAnchor.x - startAnchorOffset.x,
			y: startAnchor.y - startAnchorOffset.y,
			scale: 1,
		},
		to: {
			x: endAnchor.x - endAnchorOffset.x,
			y: endAnchor.y - endAnchorOffset.y,
			scale: 1,
		},
		current: {
			x: translateX,
			y: translateY,
			scale: 1,
		},
	});
	const resolvedWidth = width * motion.scale;
	const resolvedHeight = height * motion.scale;

	if (computeOptions.raw) {
		return {
			width: resolvedWidth,
			height: resolvedHeight,
			translateX: motion.x,
			translateY: motion.y,
			...VISIBLE_STYLE,
		};
	}

	return {
		width: resolvedWidth,
		height: resolvedHeight,
		transform: [{ translateX: motion.x }, { translateY: motion.y }],
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
	const startAnchorOffset = getAnchorOffset({
		width: start.width,
		height: start.height,
		anchor,
	});
	const endAnchorOffset = getAnchorOffset({
		width: end.width,
		height: end.height,
		anchor,
	});
	const motion = resolveMotionTransform({
		computeOptions,
		progress,
		ranges,
		entering: geometry.entering,
		start,
		end,
		from: {
			x: startAnchor.x - (baseX + startAnchorOffset.x),
			y: startAnchor.y - (baseY + startAnchorOffset.y),
			scale: 1,
		},
		to: {
			x: endAnchor.x - (baseX + endAnchorOffset.x),
			y: endAnchor.y - (baseY + endAnchorOffset.y),
			scale: 1,
		},
		current: {
			x: translateX,
			y: translateY,
			scale: 1,
		},
	});
	const resolvedWidth = width * motion.scale;
	const resolvedHeight = height * motion.scale;

	if (computeOptions.raw) {
		return {
			translateX: motion.x,
			translateY: motion.y,
			width: resolvedWidth,
			height: resolvedHeight,
			...VISIBLE_STYLE,
		};
	}

	return {
		transform: [{ translateX: motion.x }, { translateY: motion.y }],
		width: resolvedWidth,
		height: resolvedHeight,
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

	const fromScaleX = geometry.entering ? geometry.scaleX : 1;
	const fromScaleY = geometry.entering ? geometry.scaleY : 1;
	const toScaleX = geometry.entering ? 1 : 1 / geometry.scaleX;
	const toScaleY = geometry.entering ? 1 : 1 / geometry.scaleY;
	const currentScale = getUniformScale(scaleX, scaleY);
	const motion = resolveMotionTransform({
		computeOptions,
		progress,
		ranges,
		entering: geometry.entering,
		start,
		end,
		from: {
			x: geometry.entering ? start.pageX : end.pageX,
			y: geometry.entering ? start.pageY : end.pageY,
			scale: getUniformScale(fromScaleX, fromScaleY),
		},
		to: {
			x: geometry.entering ? end.pageX : start.pageX,
			y: geometry.entering ? end.pageY : start.pageY,
			scale: getUniformScale(toScaleX, toScaleY),
		},
		current: {
			x: translateX,
			y: translateY,
			scale: currentScale,
		},
	});
	const scaleRatio = getScaleRatio(motion.scale, currentScale);
	const resolvedScaleX = scaleX * scaleRatio;
	const resolvedScaleY = scaleY * scaleRatio;

	if (computeOptions.raw) {
		return {
			translateX: motion.x,
			translateY: motion.y,
			scaleX: resolvedScaleX,
			scaleY: resolvedScaleY,
			...VISIBLE_STYLE,
		};
	}

	return {
		transform: [
			{ translateX: motion.x },
			{ translateY: motion.y },
			{ scaleX: resolvedScaleX },
			{ scaleY: resolvedScaleY },
		],
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

	const offsetX = computeOptions.offset?.x ?? computeOptions.gestures?.x ?? 0;
	const offsetY = computeOptions.offset?.y ?? computeOptions.gestures?.y ?? 0;
	const fromScaleX = geometry.entering ? geometry.scaleX : 1;
	const fromScaleY = geometry.entering ? geometry.scaleY : 1;
	const toScaleX = geometry.entering ? 1 : 1 / geometry.scaleX;
	const toScaleY = geometry.entering ? 1 : 1 / geometry.scaleY;
	const currentScale = getUniformScale(scaleX, scaleY);
	const motion = resolveMotionTransform({
		computeOptions,
		progress,
		ranges,
		entering: geometry.entering,
		start: params.start,
		end: params.end,
		from: {
			x: geometry.entering ? geometry.dx : 0,
			y: geometry.entering ? geometry.dy : 0,
			scale: getUniformScale(fromScaleX, fromScaleY),
		},
		to: {
			x: geometry.entering ? 0 : -geometry.dx,
			y: geometry.entering ? 0 : -geometry.dy,
			scale: getUniformScale(toScaleX, toScaleY),
		},
		current: {
			x: translateX,
			y: translateY,
			scale: currentScale,
		},
	});
	const scaleRatio = getScaleRatio(motion.scale, currentScale);
	const resolvedScaleX = scaleX * scaleRatio;
	const resolvedScaleY = scaleY * scaleRatio;

	if (computeOptions.raw) {
		return {
			translateX: motion.x,
			translateY: motion.y,
			scaleX: resolvedScaleX,
			scaleY: resolvedScaleY,
			...VISIBLE_STYLE,
		};
	}

	return {
		transform: [
			{ translateX: offsetX },
			{ translateY: offsetY },
			{ translateX: motion.x },
			{ translateY: motion.y },
			{ scaleX: resolvedScaleX },
			{ scaleY: resolvedScaleY },
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

	const motion = resolveMotionTransform({
		computeOptions: params.computeOptions,
		progress,
		ranges,
		entering,
		start: params.start,
		end: params.end,
		from: {
			x: entering ? tx : 0,
			y: entering ? ty : 0,
			scale: entering ? s : 1,
		},
		to: {
			x: entering ? 0 : tx,
			y: entering ? 0 : ty,
			scale: entering ? 1 : s,
		},
		current: {
			x: translateX,
			y: translateY,
			scale,
		},
	});

	if (raw) {
		return {
			translateX: motion.x,
			translateY: motion.y,
			scale: motion.scale,
			...VISIBLE_STYLE,
		};
	}

	return {
		transform: [
			{ translateX: motion.x },
			{ translateY: motion.y },
			{ scale: motion.scale },
		],
		...VISIBLE_STYLE,
	};
}
