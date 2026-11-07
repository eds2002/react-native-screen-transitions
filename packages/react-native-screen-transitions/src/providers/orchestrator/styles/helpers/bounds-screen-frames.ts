import type { StyleProps, TransformArrayItem } from "react-native-reanimated";
import { getResolvedLink } from "../../../../stores/bounds/internals/links";
import {
	getScrollChainAxisDelta,
	getVisualScrollAxisDelta,
} from "../../../../stores/scroll.store";
import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../types/animation.types";
import {
	BOUNDS_SCREEN_FRAME_STYLE_KEY,
	type BoundsScreenFrame,
	type FrameRect,
	getBoundsScreenFrame,
	type MeasuredScreenTransform,
	type MeasuredScroll,
} from "../../../../utils/bounds/helpers/styles/screen-frame";
import {
	getScreenScroll,
	getScreenTransform,
} from "./screen-transform-registry";

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

/** `p -> s * p + t` per axis, in window coordinates. */
type Affine = { sx: number; sy: number; tx: number; ty: number };

const UNIT: Affine = { sx: 1, sy: 1, tx: 0, ty: 0 };

/** A screen transform (about the screen's center) as a window-space affine. */
const toAffine = (transform: ScreenTransform): Affine => {
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
const compose = (a: Affine, b: Affine): Affine => {
	"worklet";
	return {
		sx: a.sx * b.sx,
		sy: a.sy * b.sy,
		tx: a.sx * b.tx + a.tx,
		ty: a.sy * b.ty + a.ty,
	};
};

const invert = (a: Affine): Affine => {
	"worklet";
	return { sx: 1 / a.sx, sy: 1 / a.sy, tx: -a.tx / a.sx, ty: -a.ty / a.sy };
};

/** Where the element of a pair is drawn: the source screen's transform at its source, the destination's at its destination. */
const blend = (source: Affine, destination: Affine, t: number): Affine => {
	"worklet";
	return {
		sx: source.sx + (destination.sx - source.sx) * t,
		sy: source.sy + (destination.sy - source.sy) * t,
		tx: source.tx + (destination.tx - source.tx) * t,
		ty: source.ty + (destination.ty - source.ty) * t,
	};
};

const mapRect = (rect: FrameRect, a: Affine): FrameRect => {
	"worklet";
	return {
		pageX: a.sx * rect.pageX + a.tx,
		pageY: a.sy * rect.pageY + a.ty,
		width: a.sx * rect.width,
		height: a.sy * rect.height,
	};
};

const lerpRect = (from: FrameRect, to: FrameRect, t: number): FrameRect => {
	"worklet";
	return {
		pageX: from.pageX + (to.pageX - from.pageX) * t,
		pageY: from.pageY + (to.pageY - from.pageY) * t,
		width: from.width + (to.width - from.width) * t,
		height: from.height + (to.height - from.height) * t,
	};
};

/** The affine that takes rect `a` onto rect `b` (scaling about their centers). */
const rectToRect = (a: FrameRect, b: FrameRect): Affine => {
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
	measuredWith: MeasuredScreenTransform | undefined,
): T => {
	"worklet";
	if (!measuredWith?.width || !measuredWith.height) return rect;
	const laid = mapRect(rect, invert(toAffine(measuredWith)));
	return { ...rect, ...laid };
};

type MeasuredRect = FrameRect & {
	screenTransform?: MeasuredScreenTransform;
	scrollChain?: NonNullable<MeasuredScroll>["chain"];
	scroll?: NonNullable<MeasuredScroll>["scroll"];
};

/** How far a rect measured at `measured` scroll positions has moved since: lists scroll content up. */
type Shift = { x: number; y: number };

const NO_SHIFT: Shift = { x: 0, y: 0 };

const scrollShift = (measured: MeasuredScroll, screenKey: string): Shift => {
	"worklet";
	if (!measured) return NO_SHIFT;
	const live = getScreenScroll(screenKey);
	if (!live) return NO_SHIFT;
	const x = measured.chain
		? getScrollChainAxisDelta(live, measured.chain, "horizontal")
		: getVisualScrollAxisDelta(live, measured.scroll, "horizontal");
	const y = measured.chain
		? getScrollChainAxisDelta(live, measured.chain, "vertical")
		: getVisualScrollAxisDelta(live, measured.scroll, "vertical");
	return x === 0 && y === 0 ? NO_SHIFT : { x: -x, y: -y };
};

const shiftRect = (rect: FrameRect, shift: Shift): FrameRect => {
	"worklet";
	if (shift === NO_SHIFT) return rect;
	return {
		pageX: rect.pageX + shift.x,
		pageY: rect.pageY + shift.y,
		width: rect.width,
		height: rect.height,
	};
};

/** A measured rect where its screen lays it out now: without the transform it was measured with, moved by the scroll since. */
const liveLayoutRect = (rect: MeasuredRect, screenKey: string): FrameRect => {
	"worklet";
	return shiftRect(
		toLayoutSpace(rect, rect.screenTransform),
		scrollShift(
			rect.scrollChain || rect.scroll
				? { chain: rect.scrollChain, scroll: rect.scroll }
				: null,
			screenKey,
		),
	);
};

/**
 * Where the element of the frame's pair starts this frame, where its source screen lays it out: its
 * source slot, or, in flight, wherever the pairs it starts from draw it now (the deepest from its own
 * slot, each through its two screens' transforms of this frame).
 */
const resolveStart = (
	frame: BoundsScreenFrame,
	read: (key: string) => ScreenTransform,
): FrameRect => {
	"worklet";
	const chain = frame.startChain;
	const own = shiftRect(
		frame.start,
		scrollShift(frame.startScroll, frame.sourceScreenKey),
	);
	if (!chain.length) return own;
	let drawn: FrameRect | null = null;
	for (let index = chain.length - 1; index >= 0; index--) {
		const pair = chain[index];
		const link = getResolvedLink(pair.pairKey, frame.tag).link;
		const from = link?.source?.bounds as MeasuredRect | undefined;
		const to = link?.destination?.bounds as MeasuredRect | undefined;
		if (!from || !to) {
			drawn = null;
			continue;
		}
		const source = toAffine(read(pair.source));
		const start = drawn
			? mapRect(drawn, invert(source))
			: liveLayoutRect(from, pair.source);
		drawn = mapRect(
			lerpRect(start, liveLayoutRect(to, pair.destination), pair.t),
			blend(source, toAffine(read(pair.destination)), pair.t),
		);
	}
	if (!drawn) return own;
	return mapRect(drawn, invert(toAffine(read(frame.sourceScreenKey))));
};

/**
 * The transform to put in front of an element's own bounds transform so that it is drawn where it
 * belongs this frame. Its style was composed along `start -> end` where the screens lay it out; it
 * belongs on the path from where it starts now (resolveStart) to `end`, drawn through the blend of
 * the two screens' transforms (the source's at the source, the destination's at the destination). It
 * is drawn inside its own screen, which already applies that screen's transform: the correction is
 * own⁻¹ ∘ blend ∘ (composed path -> actual path), put in front of the element's transform about its
 * own center.
 */
const resolveCorrection = (
	frame: BoundsScreenFrame,
	style: StyleProps,
	read: (key: string) => ScreenTransform,
): TransformArrayItem[] | null => {
	"worklet";
	const t = frame.t;
	const start = resolveStart(frame, read);
	// Lists scroll under a transition (a list scrolled during the close): each end is where its list
	// has it now, and the element itself is drawn where its own list moved it (inline, or an escaped
	// frame following its scroll views).
	const end = shiftRect(
		frame.end,
		scrollShift(frame.endScroll, frame.destinationScreenKey),
	);
	const ownShift = scrollShift(frame.ownScroll, frame.screenKey);
	const composed = shiftRect(lerpRect(frame.start, frame.end, t), ownShift);
	const actual =
		start === frame.start && end === frame.end && ownShift === NO_SHIFT
			? composed
			: lerpRect(start, end, t);
	const path = actual === composed ? UNIT : rectToRect(composed, actual);
	const placement = compose(
		invert(toAffine(read(frame.screenKey))),
		compose(
			blend(
				toAffine(read(frame.sourceScreenKey)),
				toAffine(read(frame.destinationScreenKey)),
				t,
			),
			path,
		),
	);
	// The element scales about its own center (its box: the size method resizes it).
	const width = typeof style.width === "number" ? style.width : frame.width;
	const height = typeof style.height === "number" ? style.height : frame.height;
	const lx = frame.x + ownShift.x + width / 2;
	const ly = frame.y + ownShift.y + height / 2;
	const vx = placement.tx - (1 - placement.sx) * lx;
	const vy = placement.ty - (1 - placement.sy) * ly;
	const scaled =
		Math.abs(placement.sx - 1) > EPSILON ||
		Math.abs(placement.sy - 1) > EPSILON;
	if (!scaled && Math.abs(vx) < EPSILON && Math.abs(vy) < EPSILON) return null;
	return (scaled
		? [
				{ translateX: vx },
				{ translateY: vy },
				{ scaleX: placement.sx },
				{ scaleY: placement.sy },
			]
		: [
				{ translateX: vx },
				{ translateY: vy },
			]) as unknown as TransformArrayItem[];
};

/**
 * Whether the closing destination screen still covers the source's copy of a landed pair (its
 * window rect overlaps where the source draws the element). A screen whose size isn't known yet
 * counts as covering.
 */
const coversSource = (
	frame: BoundsScreenFrame,
	read: (key: string) => ScreenTransform,
): boolean => {
	"worklet";
	const screen = read(frame.destinationScreenKey);
	if (!screen.width || !screen.height) return true;
	const area = mapRect(
		{ pageX: 0, pageY: 0, width: screen.width, height: screen.height },
		toAffine(screen),
	);
	const source = mapRect(frame.start, toAffine(read(frame.sourceScreenKey)));
	return (
		area.pageX < source.pageX + source.width &&
		source.pageX < area.pageX + area.width &&
		area.pageY < source.pageY + source.height &&
		source.pageY < area.pageY + area.height
	);
};

/**
 * Places every bounds element this screen styles for where the screens it travels between are
 * drawn this frame (and where it is in flight, when transitions overlap), and removes the frame
 * data from their styles. `transforms` holds the screens whose transforms this one depends on (its
 * stack's, read the same frame); others are read by key. Returns the same map when there is
 * nothing to place.
 */
export const applyBoundsScreenFrames = (
	stylesMap: NormalizedTransitionInterpolatedStyle,
	transforms: Record<string, ScreenTransform | undefined>,
): NormalizedTransitionInterpolatedStyle => {
	"worklet";
	let next: Record<string, NormalizedTransitionSlotStyle | undefined> | null =
		null;
	const read = (key: string) =>
		transforms[key] ?? getScreenTransform(key) ?? IDENTITY_SCREEN_TRANSFORM;
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
		const unmoved =
			!frame.startChain.length &&
			!frame.startScroll &&
			!frame.endScroll &&
			!frame.ownScroll &&
			isIdentity(read(frame.sourceScreenKey)) &&
			isIdentity(read(frame.destinationScreenKey)) &&
			isIdentity(read(frame.screenKey));
		const correction = unmoved
			? null
			: resolveCorrection(frame, stripped, read);
		if (correction) {
			const transform = stripped.transform;
			stripped.transform = (
				Array.isArray(transform)
					? [...correction, ...(transform as TransformArrayItem[])]
					: correction
			) as StyleProps["transform"];
		}
		if (frame.landed && !coversSource(frame, read)) stripped.opacity = 0;
		next[slotId] = { ...slot, style: stripped, boundsPlaced: true };
	}
	return (next as NormalizedTransitionInterpolatedStyle | null) ?? stylesMap;
};
