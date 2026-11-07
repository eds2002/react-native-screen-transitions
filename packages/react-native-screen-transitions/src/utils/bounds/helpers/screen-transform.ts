import type { StyleProps } from "react-native-reanimated";
import type { FrameRect } from "./styles/screen-frame";

/**
 * Where a screen draws its content this frame: `p -> c + s * (p - c) + t` per axis, around the
 * screen's center `c` (the default transform origin). Only translation and scale are read; a screen
 * that rotates or skews is treated as if it only translated and scaled.
 */
export type ScreenTransform = {
	sx: number;
	sy: number;
	tx: number;
	ty: number;
	/** The screen's size, for its center. */
	width: number;
	height: number;
};

export const IDENTITY_SCREEN_TRANSFORM: ScreenTransform = {
	sx: 1,
	sy: 1,
	tx: 0,
	ty: 0,
	width: 0,
	height: 0,
};

const toNumber = (value: unknown, size: number): number | null => {
	"worklet";
	if (typeof value === "number") return value;
	if (typeof value === "string" && value.endsWith("%")) {
		const percent = Number.parseFloat(value);
		return Number.isNaN(percent) ? null : (percent / 100) * size;
	}
	return null;
};

/** The screen transform a `content` slot style draws with. */
export const readScreenTransform = (
	style: StyleProps | undefined,
	width: number,
	height: number,
): ScreenTransform => {
	"worklet";
	const transform = style?.transform;
	if (!Array.isArray(transform) || transform.length === 0) {
		return { sx: 1, sy: 1, tx: 0, ty: 0, width, height };
	}
	// Items apply right to left (the first one is outermost): compose left to right.
	let sx = 1;
	let sy = 1;
	let tx = 0;
	let ty = 0;
	for (let index = 0; index < transform.length; index++) {
		const item = transform[index] as Record<string, unknown>;
		for (const key in item) {
			const raw = item[key];
			if (key === "translateX") {
				const value = toNumber(raw, width);
				if (value !== null) tx += sx * value;
			} else if (key === "translateY") {
				const value = toNumber(raw, height);
				if (value !== null) ty += sy * value;
			} else if (key === "scale") {
				if (typeof raw === "number") {
					sx *= raw;
					sy *= raw;
				}
			} else if (key === "scaleX") {
				if (typeof raw === "number") sx *= raw;
			} else if (key === "scaleY") {
				if (typeof raw === "number") sy *= raw;
			}
		}
	}
	return { sx, sy, tx, ty, width, height };
};

export const areScreenTransformsEqual = (
	a: ScreenTransform,
	b: ScreenTransform,
) => {
	"worklet";
	return (
		a === b ||
		(a.sx === b.sx &&
			a.sy === b.sy &&
			a.tx === b.tx &&
			a.ty === b.ty &&
			a.width === b.width &&
			a.height === b.height)
	);
};

export const isIdentity = (transform: ScreenTransform) => {
	"worklet";
	return (
		transform.sx === 1 &&
		transform.sy === 1 &&
		transform.tx === 0 &&
		transform.ty === 0
	);
};

/** `p -> s * p + t` per axis, in window coordinates. */
export type Affine = { sx: number; sy: number; tx: number; ty: number };

export const UNIT: Affine = { sx: 1, sy: 1, tx: 0, ty: 0 };

/** A screen transform (about the screen's center) as a window-space affine. */
export const toAffine = (transform: ScreenTransform): Affine => {
	"worklet";
	const cx = transform.width / 2;
	const cy = transform.height / 2;
	return {
		sx: transform.sx,
		sy: transform.sy,
		tx: cx - transform.sx * cx + transform.tx,
		ty: cy - transform.sy * cy + transform.ty,
	};
};

/** `a` after `b`. */
export const compose = (a: Affine, b: Affine): Affine => {
	"worklet";
	return {
		sx: a.sx * b.sx,
		sy: a.sy * b.sy,
		tx: a.sx * b.tx + a.tx,
		ty: a.sy * b.ty + a.ty,
	};
};

export const invert = (a: Affine): Affine => {
	"worklet";
	return { sx: 1 / a.sx, sy: 1 / a.sy, tx: -a.tx / a.sx, ty: -a.ty / a.sy };
};

/** Where the element of a pair is drawn: the source screen's transform at its source, the destination's at its destination. */
export const blend = (
	source: Affine,
	destination: Affine,
	t: number,
): Affine => {
	"worklet";
	return {
		sx: source.sx + (destination.sx - source.sx) * t,
		sy: source.sy + (destination.sy - source.sy) * t,
		tx: source.tx + (destination.tx - source.tx) * t,
		ty: source.ty + (destination.ty - source.ty) * t,
	};
};

export const mapRect = (rect: FrameRect, a: Affine): FrameRect => {
	"worklet";
	return {
		pageX: a.sx * rect.pageX + a.tx,
		pageY: a.sy * rect.pageY + a.ty,
		width: a.sx * rect.width,
		height: a.sy * rect.height,
	};
};

export const lerpRect = (
	from: FrameRect,
	to: FrameRect,
	t: number,
): FrameRect => {
	"worklet";
	return {
		pageX: from.pageX + (to.pageX - from.pageX) * t,
		pageY: from.pageY + (to.pageY - from.pageY) * t,
		width: from.width + (to.width - from.width) * t,
		height: from.height + (to.height - from.height) * t,
	};
};

/** The affine that takes rect `a` onto rect `b` (scaling about their centers). */
export const rectToRect = (a: FrameRect, b: FrameRect): Affine => {
	"worklet";
	const sx = a.width > 0 ? b.width / a.width : 1;
	const sy = a.height > 0 ? b.height / a.height : 1;
	return {
		sx,
		sy,
		tx: b.pageX + b.width / 2 - sx * (a.pageX + a.width / 2),
		ty: b.pageY + b.height / 2 - sy * (a.pageY + a.height / 2),
	};
};

/**
 * A measured rect where its screen lays it out: the inverse of the transform the screen had when it
 * was measured (measurements are in window space and include it).
 */
export const toLayoutSpace = <T extends FrameRect>(
	rect: T,
	measuredWith: ScreenTransform | undefined,
): T => {
	"worklet";
	if (!measuredWith?.width || !measuredWith.height) return rect;
	const laid = mapRect(rect, invert(toAffine(measuredWith)));
	return { ...rect, ...laid };
};
