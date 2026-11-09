import type { TransformsStyle } from "react-native";
import {
	Extrapolation,
	interpolate,
	type MeasuredDimensions,
	type StyleProps,
} from "react-native-reanimated";
import { EPSILON } from "../../../../constants";
import type {
	BoundsAnchor,
	BoundsInternalOptions,
	BoundsInterpolationProps,
	BoundsMotionTransform,
} from "../../../../types/bounds.types";
import type {
	ContentTransformGeometry,
	RelativeGeometry,
} from "../../types/geometry";
import { getAnchorPoint } from "../geometry";

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
	computeOptions: BoundsInternalOptions;
	interpolationProps: BoundsInterpolationProps;
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
	computeOptions: BoundsInternalOptions;
	interpolationProps: BoundsInterpolationProps;
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
	interpolationProps,
	progress,
	ranges,
	start,
	end,
	current,
}: {
	computeOptions: BoundsInternalOptions;
	interpolationProps: BoundsInterpolationProps;
	progress: number;
	ranges: readonly [number, number];
	start: MeasuredDimensions;
	end: MeasuredDimensions;
	current: BoundsMotionTransform;
}) => {
	"worklet";

	if (!computeOptions.motion) {
		return current;
	}

	return computeOptions.motion({
		progress: normalizeRangeProgress(progress, ranges),
		current,
		start,
		end,
		props: interpolationProps,
	});
};

type MotionTransformEntry = Exclude<
	TransformsStyle["transform"],
	string | undefined
>[number];

/**
 * Builds the rendered transform stack for a resolved motion: optional
 * perspective first (so rotations project in 3D), translates, optional
 * rotations, then the composer's scale entries — rotation happens in
 * unscaled space around the element center.
 */
const composeMotionTransform = (
	motion: BoundsMotionTransform,
	scaleTransforms?: MotionTransformEntry[],
) => {
	"worklet";
	const transform: MotionTransformEntry[] = [];
	const rotate = motion.rotate ?? 0;
	const rotateX = motion.rotateX ?? 0;
	const rotateY = motion.rotateY ?? 0;

	if (
		rotate !== 0 ||
		rotateX !== 0 ||
		rotateY !== 0 ||
		motion.perspective !== undefined
	) {
		transform.push({ perspective: motion.perspective ?? 1000 });
	}

	transform.push({ translateX: motion.x }, { translateY: motion.y });

	if (rotateX !== 0) {
		transform.push({ rotateX: `${rotateX}deg` });
	}
	if (rotateY !== 0) {
		transform.push({ rotateY: `${rotateY}deg` });
	}
	if (rotate !== 0) {
		transform.push({ rotate: `${rotate}deg` });
	}

	if (scaleTransforms) {
		for (const entry of scaleTransforms) {
			transform.push(entry);
		}
	}

	return transform;
};

/**
 * Size method: the element's box grows from its start rect to its end rect, its anchor moving along
 * the path. `absolute` places it in window space; otherwise relative to where its screen lays it out
 * (the destination's slot entering, the source's leaving).
 */
export function composeSize(
	params: ElementComposeParams,
	absolute: boolean,
): StyleProps {
	"worklet";
	const { start, end, geometry, progress, ranges, computeOptions } = params;
	const anchor = computeOptions.anchor ?? "center";
	const startAnchor = getAnchorPoint(start, anchor);
	const endAnchor = getAnchorPoint(end, anchor);
	const base = absolute ? null : geometry.entering ? end : start;
	const at = (from: number, to: number) => {
		"worklet";
		return interpolate(progress, ranges, [from, to], Extrapolation.CLAMP);
	};

	const width = at(start.width, end.width);
	const height = at(start.height, end.height);
	const anchorOffset = getAnchorOffset({ width, height, anchor });
	const motion = resolveMotionTransform({
		computeOptions,
		interpolationProps: params.interpolationProps,
		progress,
		ranges,
		start,
		end,
		current: {
			x: at(startAnchor.x, endAnchor.x) - ((base?.pageX ?? 0) + anchorOffset.x),
			y: at(startAnchor.y, endAnchor.y) - ((base?.pageY ?? 0) + anchorOffset.y),
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
			rotate: motion.rotate ?? 0,
			rotateX: motion.rotateX ?? 0,
			rotateY: motion.rotateY ?? 0,
			transformOrigin: motion.transformOrigin,
		};
	}

	return {
		width: resolvedWidth,
		height: resolvedHeight,
		transform: composeMotionTransform(motion),
		transformOrigin: motion.transformOrigin,
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

	const currentScale = getUniformScale(scaleX, scaleY);
	const motion = resolveMotionTransform({
		computeOptions,
		interpolationProps: params.interpolationProps,
		progress,
		ranges,
		start,
		end,
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
			rotate: motion.rotate ?? 0,
			rotateX: motion.rotateX ?? 0,
			rotateY: motion.rotateY ?? 0,
			transformOrigin: motion.transformOrigin,
			scaleX: resolvedScaleX,
			scaleY: resolvedScaleY,
		};
	}

	return {
		transform: composeMotionTransform(motion, [
			{ scaleX: resolvedScaleX },
			{ scaleY: resolvedScaleY },
		]),
		transformOrigin: motion.transformOrigin,
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

	const offsetX = computeOptions.offset?.x ?? 0;
	const offsetY = computeOptions.offset?.y ?? 0;
	const currentScale = getUniformScale(scaleX, scaleY);
	const motion = resolveMotionTransform({
		computeOptions,
		interpolationProps: params.interpolationProps,
		progress,
		ranges,
		start: params.start,
		end: params.end,
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
			rotate: motion.rotate ?? 0,
			rotateX: motion.rotateX ?? 0,
			rotateY: motion.rotateY ?? 0,
			transformOrigin: motion.transformOrigin,
			scaleX: resolvedScaleX,
			scaleY: resolvedScaleY,
		};
	}

	return {
		transform: [
			{ translateX: offsetX },
			{ translateY: offsetY },
			...composeMotionTransform(motion, [
				{ scaleX: resolvedScaleX },
				{ scaleY: resolvedScaleY },
			]),
		],
		transformOrigin: motion.transformOrigin,
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
		interpolationProps: params.interpolationProps,
		progress,
		ranges,
		start: params.start,
		end: params.end,
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
			rotate: motion.rotate ?? 0,
			rotateX: motion.rotateX ?? 0,
			rotateY: motion.rotateY ?? 0,
			transformOrigin: motion.transformOrigin,
			scale: motion.scale,
		};
	}

	return {
		transform: composeMotionTransform(motion, [{ scale: motion.scale }]),
		transformOrigin: motion.transformOrigin,
	};
}
