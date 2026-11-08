import type { StyleProps } from "react-native-reanimated";
import type { FrameRect } from "./styles/screen-frame";

/**
 * Where a screen draws its content this frame: `p -> c + t + R(rot) · diag(sx, sy) · (p - c)`
 * around the screen's center `c` (the default transform origin). Translation, rotation and scale are
 * read; a screen that skews is treated as if it only translated, rotated and scaled.
 */
export type ScreenTransform = {
	sx: number;
	sy: number;
	tx: number;
	ty: number;
	/** Rotation in radians (absent when 0). */
	rot?: number;
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

/** A rotation value (`"12deg"`, `"0.2rad"`, or a number of radians) in radians. */
const toRadians = (value: unknown): number | null => {
	"worklet";
	if (typeof value === "number") return value;
	if (typeof value !== "string") return null;
	const amount = Number.parseFloat(value);
	if (Number.isNaN(amount)) return null;
	if (value.endsWith("deg")) return (amount * Math.PI) / 180;
	if (value.endsWith("rad")) return amount;
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
	// Items apply right to left (the first one is outermost): compose left to right as a matrix
	// [a c; b d] with translation (e, f).
	let a = 1;
	let b = 0;
	let c = 0;
	let d = 1;
	let e = 0;
	let f = 0;
	for (let index = 0; index < transform.length; index++) {
		const item = transform[index] as Record<string, unknown>;
		for (const key in item) {
			const raw = item[key];
			if (key === "translateX") {
				const value = toNumber(raw, width);
				if (value !== null) {
					e += a * value;
					f += b * value;
				}
			} else if (key === "translateY") {
				const value = toNumber(raw, height);
				if (value !== null) {
					e += c * value;
					f += d * value;
				}
			} else if (key === "rotate" || key === "rotateZ") {
				const angle = toRadians(raw);
				if (angle !== null && angle !== 0) {
					const cos = Math.cos(angle);
					const sin = Math.sin(angle);
					const na = a * cos + c * sin;
					const nb = b * cos + d * sin;
					c = c * cos - a * sin;
					d = d * cos - b * sin;
					a = na;
					b = nb;
				}
			} else if (key === "scale" || key === "scaleX" || key === "scaleY") {
				if (typeof raw === "number") {
					if (key !== "scaleY") {
						a *= raw;
						b *= raw;
					}
					if (key !== "scaleX") {
						c *= raw;
						d *= raw;
					}
				}
			}
		}
	}
	const sx = Math.hypot(a, b);
	if (sx === 0) return { sx: 0, sy: 0, tx: e, ty: f, width, height };
	const rot = Math.atan2(b, a);
	const sy = (a * d - b * c) / sx;
	return rot === 0
		? { sx, sy, tx: e, ty: f, width, height }
		: { sx, sy, tx: e, ty: f, rot, width, height };
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
			(a.rot ?? 0) === (b.rot ?? 0) &&
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
		transform.ty === 0 &&
		!transform.rot
	);
};

/** `p -> [a c; b d] · p + (tx, ty)`, in window coordinates. */
export type Affine = {
	a: number;
	b: number;
	c: number;
	d: number;
	tx: number;
	ty: number;
};

export const UNIT: Affine = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };

/** Whether an affine only scales and translates. */
export const isAxisAligned = (a: Affine) => {
	"worklet";
	return a.b === 0 && a.c === 0;
};

/** A screen transform (about the screen's center) as a window-space affine. */
export const toAffine = (transform: ScreenTransform): Affine => {
	"worklet";
	const cx = transform.width / 2;
	const cy = transform.height / 2;
	const rot = transform.rot ?? 0;
	const cos = rot === 0 ? 1 : Math.cos(rot);
	const sin = rot === 0 ? 0 : Math.sin(rot);
	const a = cos * transform.sx;
	const b = sin * transform.sx;
	const c = -sin * transform.sy;
	const d = cos * transform.sy;
	return {
		a,
		b,
		c,
		d,
		tx: cx + transform.tx - (a * cx + c * cy),
		ty: cy + transform.ty - (b * cx + d * cy),
	};
};

/** `a` after `b`. */
export const compose = (a: Affine, b: Affine): Affine => {
	"worklet";
	return {
		a: a.a * b.a + a.c * b.b,
		b: a.b * b.a + a.d * b.b,
		c: a.a * b.c + a.c * b.d,
		d: a.b * b.c + a.d * b.d,
		tx: a.a * b.tx + a.c * b.ty + a.tx,
		ty: a.b * b.tx + a.d * b.ty + a.ty,
	};
};

export const invert = (a: Affine): Affine => {
	"worklet";
	const det = a.a * a.d - a.b * a.c;
	if (det === 0) return UNIT;
	const ia = a.d / det;
	const ib = -a.b / det;
	const ic = -a.c / det;
	const id = a.a / det;
	return {
		a: ia,
		b: ib,
		c: ic,
		d: id,
		tx: -(ia * a.tx + ic * a.ty),
		ty: -(ib * a.tx + id * a.ty),
	};
};

/** An affine's rotation, scales and shear: `[a c; b d] = R(rot) · [sx k; 0 sy]`. */
export const decompose = (a: Affine) => {
	"worklet";
	const sx = Math.hypot(a.a, a.b);
	if (sx === 0) return { rot: 0, sx: 0, sy: 0, k: 0 };
	return {
		rot: Math.atan2(a.b, a.a),
		sx,
		sy: (a.a * a.d - a.b * a.c) / sx,
		k: (a.a * a.c + a.b * a.d) / sx,
	};
};

const fromParts = (
	rot: number,
	sx: number,
	sy: number,
	tx: number,
	ty: number,
): Affine => {
	"worklet";
	const cos = rot === 0 ? 1 : Math.cos(rot);
	const sin = rot === 0 ? 0 : Math.sin(rot);
	return { a: cos * sx, b: sin * sx, c: -sin * sy, d: cos * sy, tx, ty };
};

/**
 * Where the element of a pair is drawn: the source screen's transform at its source, the
 * destination's at its destination. Rotation, scale and translation are interpolated each on their
 * own, so an element between a tilted screen and a straight one turns without shearing.
 */
export const blend = (
	source: Affine,
	destination: Affine,
	t: number,
): Affine => {
	"worklet";
	if (isAxisAligned(source) && isAxisAligned(destination)) {
		return {
			a: source.a + (destination.a - source.a) * t,
			b: 0,
			c: 0,
			d: source.d + (destination.d - source.d) * t,
			tx: source.tx + (destination.tx - source.tx) * t,
			ty: source.ty + (destination.ty - source.ty) * t,
		};
	}
	const from = decompose(source);
	const to = decompose(destination);
	let turn = to.rot - from.rot;
	if (turn > Math.PI) turn -= 2 * Math.PI;
	else if (turn < -Math.PI) turn += 2 * Math.PI;
	return fromParts(
		from.rot + turn * t,
		from.sx + (to.sx - from.sx) * t,
		from.sy + (to.sy - from.sy) * t,
		source.tx + (destination.tx - source.tx) * t,
		source.ty + (destination.ty - source.ty) * t,
	);
};

/**
 * A rect drawn through an affine, as the box it is drawn as: its center mapped, its sides scaled.
 * Under a rotation the box turns with it (its axis-aligned bounds are larger: see `boundingBox`).
 */
export const mapRect = (rect: FrameRect, a: Affine): FrameRect => {
	"worklet";
	if (isAxisAligned(a)) {
		return {
			pageX: a.a * rect.pageX + a.tx,
			pageY: a.d * rect.pageY + a.ty,
			width: a.a * rect.width,
			height: a.d * rect.height,
		};
	}
	const cx = rect.pageX + rect.width / 2;
	const cy = rect.pageY + rect.height / 2;
	const x = a.a * cx + a.c * cy + a.tx;
	const y = a.b * cx + a.d * cy + a.ty;
	const width = Math.hypot(a.a, a.b) * rect.width;
	const height = Math.hypot(a.c, a.d) * rect.height;
	return { pageX: x - width / 2, pageY: y - height / 2, width, height };
};

/** The axis-aligned bounds of a rect drawn through an affine. */
export const boundingBox = (rect: FrameRect, a: Affine): FrameRect => {
	"worklet";
	const cx = rect.pageX + rect.width / 2;
	const cy = rect.pageY + rect.height / 2;
	const x = a.a * cx + a.c * cy + a.tx;
	const y = a.b * cx + a.d * cy + a.ty;
	const width = Math.abs(a.a) * rect.width + Math.abs(a.c) * rect.height;
	const height = Math.abs(a.b) * rect.width + Math.abs(a.d) * rect.height;
	return { pageX: x - width / 2, pageY: y - height / 2, width, height };
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
		a: sx,
		b: 0,
		c: 0,
		d: sy,
		tx: b.pageX + b.width / 2 - sx * (a.pageX + a.width / 2),
		ty: b.pageY + b.height / 2 - sy * (a.pageY + a.height / 2),
	};
};

/**
 * The rect whose drawing through `a` has the given axis-aligned bounds: what a measurement (which
 * reports a turned view's bounds) laid out. The center maps back exactly; the sides solve
 * `bounds = |A| · size`. Near a 45° turn the sides can't be told apart and are only unscaled.
 */
export const unboundingBox = (bounds: FrameRect, a: Affine): FrameRect => {
	"worklet";
	const inverse = invert(a);
	const cx = bounds.pageX + bounds.width / 2;
	const cy = bounds.pageY + bounds.height / 2;
	const x = inverse.a * cx + inverse.c * cy + inverse.tx;
	const y = inverse.b * cx + inverse.d * cy + inverse.ty;
	const m11 = Math.abs(a.a);
	const m12 = Math.abs(a.c);
	const m21 = Math.abs(a.b);
	const m22 = Math.abs(a.d);
	const det = m11 * m22 - m12 * m21;
	let width: number;
	let height: number;
	if (Math.abs(det) > 0.2 * m11 * m22 && det !== 0) {
		width = (m22 * bounds.width - m12 * bounds.height) / det;
		height = (m11 * bounds.height - m21 * bounds.width) / det;
	} else {
		width = bounds.width / (Math.hypot(a.a, a.b) || 1);
		height = bounds.height / (Math.hypot(a.c, a.d) || 1);
	}
	return { pageX: x - width / 2, pageY: y - height / 2, width, height };
};

/**
 * A measured rect where its screen lays it out: the inverse of the transform the screen had when it
 * was measured (measurements are in window space and include it; a turned screen's are the bounds
 * of the turned box).
 */
export const toLayoutSpace = <T extends FrameRect>(
	rect: T,
	measuredWith: ScreenTransform | undefined,
): T => {
	"worklet";
	if (!measuredWith?.width || !measuredWith.height) return rect;
	const affine = toAffine(measuredWith);
	const laid = measuredWith.rot
		? unboundingBox(rect, affine)
		: mapRect(rect, invert(affine));
	return { ...rect, ...laid };
};
