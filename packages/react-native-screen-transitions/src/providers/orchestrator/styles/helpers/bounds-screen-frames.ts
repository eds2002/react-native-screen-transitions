import type { StyleProps, TransformArrayItem } from "react-native-reanimated";
import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../types/animation.types";
import {
	BOUNDS_SCREEN_FRAME_STYLE_KEY,
	type BoundsScreenFrame,
	getBoundsScreenFrame,
	type MeasuredScreenTransform,
} from "../../../../utils/bounds/helpers/styles/screen-frame";
import { getScreenTransform } from "./screen-transform-registry";

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

const isIdentity = (transform: ScreenTransform) => {
	"worklet";
	return (
		transform.sx === 1 &&
		transform.sy === 1 &&
		transform.tx === 0 &&
		transform.ty === 0
	);
};

const stripFrame = (style: StyleProps): StyleProps => {
	"worklet";
	const rest: Record<string, unknown> = {};
	const source = style as Record<string, unknown>;
	for (const key in source) {
		if (key === BOUNDS_SCREEN_FRAME_STYLE_KEY) continue;
		rest[key] = source[key];
	}
	return rest as StyleProps;
};

const EPSILON = 1e-4;

/**
 * How far a screen moved since a boundary on it was measured: `now ∘ measured⁻¹`. Measurements are
 * in window space, so they already include the transform the screen had then.
 */
export const movedSince = (
	now: ScreenTransform,
	measured: MeasuredScreenTransform | undefined,
): ScreenTransform => {
	"worklet";
	if (!measured) return now;
	const sx = now.sx / measured.sx;
	const sy = now.sy / measured.sy;
	return {
		sx,
		sy,
		tx: now.tx - sx * measured.tx,
		ty: now.ty - sy * measured.ty,
		width: now.width || measured.width,
		height: now.height || measured.height,
	};
};

type Rect = {
	x: number;
	y: number;
	pageX: number;
	pageY: number;
	width: number;
	height: number;
};

const mapRect = (
	rect: Rect,
	sx: number,
	sy: number,
	tx: number,
	ty: number,
	width: number,
	height: number,
): Rect => {
	"worklet";
	const cx = width / 2;
	const cy = height / 2;
	const centerX = rect.pageX + rect.width / 2;
	const centerY = rect.pageY + rect.height / 2;
	const nextWidth = rect.width * sx;
	const nextHeight = rect.height * sy;
	const pageX = cx + sx * (centerX - cx) + tx - nextWidth / 2;
	const pageY = cy + sy * (centerY - cy) + ty - nextHeight / 2;
	return {
		x: rect.x + (pageX - rect.pageX),
		y: rect.y + (pageY - rect.pageY),
		pageX,
		pageY,
		width: nextWidth,
		height: nextHeight,
	};
};

const readNow = (key: string) => {
	"worklet";
	return getScreenTransform(key) ?? IDENTITY_SCREEN_TRANSFORM;
};

/**
 * Where an element travelling a pair is drawn right now: its path rect (in measured space) through
 * the blend of how far the pair's two screens moved since they were measured. The same thing
 * applyBoundsScreenFrames draws, for reading another pair's element (a sibling still in flight).
 */
export const resolveDrawnRect = (
	rect: Rect,
	t: number,
	source: { key: string; measuredWith?: MeasuredScreenTransform },
	destination: { key: string; measuredWith?: MeasuredScreenTransform },
): Rect => {
	"worklet";
	const s = movedSince(readNow(source.key), source.measuredWith);
	const d = movedSince(readNow(destination.key), destination.measuredWith);
	const width = s.width || d.width;
	const height = s.height || d.height;
	if (!width || !height) return rect;
	return mapRect(
		rect,
		s.sx + (d.sx - s.sx) * t,
		s.sy + (d.sy - s.sy) * t,
		s.tx + (d.tx - s.tx) * t,
		s.ty + (d.ty - s.ty) * t,
		width,
		height,
	);
};

/**
 * A measured rect where its screen lays it out: the inverse of the transform the screen had when it
 * was measured (measurements are in window space and include it).
 */
export const toLayoutSpace = <T extends Rect>(
	rect: T,
	measuredWith: MeasuredScreenTransform | undefined,
): T => {
	"worklet";
	if (!measuredWith?.width || !measuredWith.height) return rect;
	return {
		...rect,
		...mapRect(
			rect,
			1 / measuredWith.sx,
			1 / measuredWith.sy,
			-measuredWith.tx / measuredWith.sx,
			-measuredWith.ty / measuredWith.sy,
			measuredWith.width,
			measuredWith.height,
		),
	};
};

/** A drawn rect in a screen's measured space (the inverse of how far it moved since measured). */
export const toMeasuredSpace = (
	rect: Rect,
	screen: { key: string; measuredWith?: MeasuredScreenTransform },
): Rect => {
	"worklet";
	const m = movedSince(readNow(screen.key), screen.measuredWith);
	if (!m.width || !m.height) return rect;
	return mapRect(
		rect,
		1 / m.sx,
		1 / m.sy,
		-m.tx / m.sx,
		-m.ty / m.sy,
		m.width,
		m.height,
	);
};

/**
 * The transform to put in front of an element's own bounds transform so that it is drawn where the
 * two screens show its ends right now. The element's path is computed from the measured ends as if
 * neither screen moved since; its source end belongs to the source screen and its destination end
 * to the destination screen, so the element is drawn through the blend of how far each screen
 * moved (the source's at the source, the destination's at the destination). It is drawn inside its
 * own screen, which already moves it with that screen: the correction is the blend, minus that.
 * Worked in coordinates around the screen's center (where screen transforms scale from).
 */
const resolveCorrection = (
	frame: BoundsScreenFrame,
	style: StyleProps,
	source: ScreenTransform,
	destination: ScreenTransform,
	own: ScreenTransform,
	ownMeasured: MeasuredScreenTransform | undefined,
): TransformArrayItem[] | null => {
	"worklet";
	const t = frame.t;
	const bsx = source.sx + (destination.sx - source.sx) * t;
	const bsy = source.sy + (destination.sy - source.sy) * t;
	const btx = source.tx + (destination.tx - source.tx) * t;
	const bty = source.ty + (destination.ty - source.ty) * t;
	// The measured-space offset of the element's box from where its path assumes it is: the screen's
	// own transform when it was measured, plus the path's shift (see BoundsScreenFrame).
	const omx = (ownMeasured?.tx ?? 0) + frame.shiftX;
	const omy = (ownMeasured?.ty ?? 0) + frame.shiftY;
	// Local point q is drawn at own(q); the path puts it at measured-space point q + measured offset,
	// which should be drawn at blend(that): correction(q) = own⁻¹(blend(q + measured offset)).
	const kx = bsx / own.sx;
	const ky = bsy / own.sy;
	const ux = (bsx * omx + btx - own.tx) / own.sx;
	const uy = (bsy * omy + bty - own.ty) / own.sy;

	// The correction scales around the screen's center; the element scales around its own center.
	const width =
		source.width ||
		destination.width ||
		own.width ||
		ownMeasured?.width ||
		frame.width * 2;
	const height =
		source.height ||
		destination.height ||
		own.height ||
		ownMeasured?.height ||
		frame.height * 2;
	const cx = width / 2;
	const cy = height / 2;
	const elementWidth =
		typeof style.width === "number" ? style.width : frame.width;
	const elementHeight =
		typeof style.height === "number" ? style.height : frame.height;
	const lx = frame.x - (ownMeasured?.tx ?? 0) + elementWidth / 2;
	const ly = frame.y - (ownMeasured?.ty ?? 0) + elementHeight / 2;
	const vx = (1 - kx) * (cx - lx) + ux;
	const vy = (1 - ky) * (cy - ly) + uy;

	const scaled = Math.abs(kx - 1) > EPSILON || Math.abs(ky - 1) > EPSILON;
	if (!scaled && Math.abs(vx) < EPSILON && Math.abs(vy) < EPSILON) return null;
	return (scaled
		? [{ translateX: vx }, { translateY: vy }, { scaleX: kx }, { scaleY: ky }]
		: [
				{ translateX: vx },
				{ translateY: vy },
			]) as unknown as TransformArrayItem[];
};

/**
 * Corrects every bounds element this screen styles for where the screens it travels between are
 * drawn this frame, and removes the frame data from their styles. Returns the same map when there
 * is nothing to correct.
 */
export const applyBoundsScreenFrames = (
	stylesMap: NormalizedTransitionInterpolatedStyle,
	transforms: Record<string, ScreenTransform | undefined>,
): NormalizedTransitionInterpolatedStyle => {
	"worklet";
	let next: Record<string, NormalizedTransitionSlotStyle | undefined> | null =
		null;
	for (const slotId in stylesMap) {
		const slot = stylesMap[slotId];
		const style = slot?.style;
		const frame = getBoundsScreenFrame(style);
		if (!slot || !style || !frame) continue;
		if (!next) {
			next = {};
			for (const key in stylesMap) next[key] = stylesMap[key];
		}
		const stripped = stripFrame(style);
		const read = (key: string) =>
			transforms[key] ?? getScreenTransform(key) ?? IDENTITY_SCREEN_TRANSFORM;
		const sourceNow = read(frame.sourceScreenKey);
		const destinationNow = read(frame.destinationScreenKey);
		const ownNow = read(frame.screenKey);
		const ownMeasured =
			frame.screenKey === frame.destinationScreenKey
				? frame.destinationMeasuredWith
				: frame.sourceMeasuredWith;
		const unmoved =
			!frame.shiftX &&
			!frame.shiftY &&
			isIdentity(sourceNow) &&
			isIdentity(destinationNow) &&
			isIdentity(ownNow) &&
			!frame.sourceMeasuredWith &&
			!frame.destinationMeasuredWith;
		const correction = unmoved
			? null
			: resolveCorrection(
					frame,
					stripped,
					movedSince(sourceNow, frame.sourceMeasuredWith),
					movedSince(destinationNow, frame.destinationMeasuredWith),
					ownNow,
					ownMeasured,
				);
		if (correction) {
			const transform = stripped.transform;
			stripped.transform = (
				Array.isArray(transform)
					? [...correction, ...(transform as TransformArrayItem[])]
					: correction
			) as StyleProps["transform"];
		}
		next[slotId] = { ...slot, style: stripped };
	}
	return (next as NormalizedTransitionInterpolatedStyle | null) ?? stylesMap;
};
