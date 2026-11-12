import type { StyleProps, TransformArrayItem } from "react-native-reanimated";
import {
	getResolvedLink,
	getScreenScroll,
	getScreenTransform,
} from "../../../../stores/bounds";
import { getMeasuredScrollAxisDelta } from "../../../../stores/scroll.store";
import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../types/animation.types";
import type { MeasuredBounds } from "../../../../types/bounds.types";
import type { FrameRect, ScreenTransform } from "../../types/geometry";
import {
	blend,
	boundingBox,
	compose,
	decompose,
	IDENTITY_SCREEN_TRANSFORM,
	invert,
	isAxisAligned,
	isIdentity,
	lerpRect,
	mapRect,
	rectToRect,
	toAffine,
	toLayoutSpace,
	UNIT,
} from "../screen-transform";
import {
	BOUNDS_SCREEN_FRAME_STYLE_KEY,
	type BoundsScreenFrame,
	getBoundsScreenFrame,
	type MeasuredScroll,
	scrollOf,
} from "./screen-frame";
import { resolveVisualStyle, transformScale } from "./visual-styles";

/** A style this file builds itself, so it may write to it (Reanimated 4.7 types styles read-only). */
type OwnStyle = { -readonly [K in keyof StyleProps]: StyleProps[K] };

/** A copy of `style` without its frame data: the caller's own, to place. */
const stripFrame = (style: StyleProps): OwnStyle => {
	"worklet";
	const rest: Record<string, unknown> = {};
	const source = style as Record<string, unknown>;
	for (const key in source) {
		if (key === BOUNDS_SCREEN_FRAME_STYLE_KEY) continue;
		rest[key] = source[key];
	}
	return rest as OwnStyle;
};

const EPSILON = 1e-4;

/**
 * Whether `own` already holds the steps of `generated` first (styles may be copied on their way
 * here, so steps are compared by value): an interpolator that composed the bounds transform itself.
 */
const startsWithTransform = (own: unknown[], generated: unknown[]) => {
	"worklet";
	if (own === generated) return true;
	if (own.length < generated.length) return false;
	for (let i = 0; i < generated.length; i++) {
		const x = own[i] as Record<string, unknown>;
		const y = generated[i] as Record<string, unknown>;
		if (x === y) continue;
		if (!x || !y || typeof x !== "object" || typeof y !== "object")
			return false;
		let count = 0;
		for (const key in x) {
			count++;
			if (x[key] !== y[key]) return false;
		}
		for (const _ in y) count--;
		if (count !== 0) return false;
	}
	return true;
};

/** How far a rect measured at `measured` scroll positions has moved since: lists scroll content up. */
type Shift = { x: number; y: number };

const NO_SHIFT: Shift = { x: 0, y: 0 };

const scrollShift = (measured: MeasuredScroll, screenKey: string): Shift => {
	"worklet";
	if (!measured) return NO_SHIFT;
	const live = getScreenScroll(screenKey);
	if (!live) return NO_SHIFT;
	const x = getMeasuredScrollAxisDelta(live, measured, "horizontal");
	const y = getMeasuredScrollAxisDelta(live, measured, "vertical");
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
const liveLayoutRect = (rect: MeasuredBounds, screenKey: string): FrameRect => {
	"worklet";
	return shiftRect(
		toLayoutSpace(rect, rect.screenTransform),
		scrollShift(scrollOf(rect), screenKey),
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
		const from = link?.source?.bounds;
		const to = link?.destination?.bounds;
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
 * How an element's style changes to be drawn where it belongs: a transform in front of its own, or,
 * for an element whose box is sized (the size method), a new box and the translation that puts it
 * there (`replace`: the transform replaces its own).
 */
type Correction = {
	transform: TransformArrayItem[];
	replace?: boolean;
	width?: number;
	height?: number;
};

/**
 * The size method resizes its element's box and never scales it: its content is laid out at the
 * box's size. A correction that scales it (overlapping transitions: the path it is drawn along is
 * not the one it was composed along) resizes the box by as much instead, keeping it where the scale
 * would have drawn it: `p -> L + v + A (p + own - L)` about its center L moves its top-left by
 * `v + A own + (1 - A) size / 2`. Only for an element moved by translation alone.
 */
const resizeInstead = (
	style: StyleProps,
	a: number,
	d: number,
	vx: number,
	vy: number,
): Correction | null => {
	"worklet";
	const { width, height } = style;
	if (typeof width !== "number" || typeof height !== "number") return null;
	let ownX = 0;
	let ownY = 0;
	const own = style.transform;
	if (Array.isArray(own)) {
		for (const entry of own as Record<string, unknown>[]) {
			for (const key in entry) {
				const value = entry[key];
				if (typeof value !== "number") return null;
				if (key === "translateX") ownX += value;
				else if (key === "translateY") ownY += value;
				else return null;
			}
		}
	} else if (own !== undefined) {
		return null;
	}
	return {
		transform: [
			{ translateX: vx + a * ownX + ((1 - a) * width) / 2 },
			{ translateY: vy + d * ownY + ((1 - d) * height) / 2 },
		] as unknown as TransformArrayItem[],
		replace: true,
		width: width * a,
		height: height * d,
	};
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
): Correction | null => {
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
	// The element turns and scales about its own center (its box: the size method resizes it):
	// `p -> A p + t` is a move by `A L + t - L` and then A about L.
	const width = typeof style.width === "number" ? style.width : frame.width;
	const height = typeof style.height === "number" ? style.height : frame.height;
	const lx = frame.x + ownShift.x + width / 2;
	const ly = frame.y + ownShift.y + height / 2;
	const vx = placement.a * lx + placement.c * ly + placement.tx - lx;
	const vy = placement.b * lx + placement.d * ly + placement.ty - ly;
	const move = [{ translateX: vx }, { translateY: vy }];
	if (isAxisAligned(placement)) {
		const scaled =
			Math.abs(placement.a - 1) > EPSILON ||
			Math.abs(placement.d - 1) > EPSILON;
		if (!scaled && Math.abs(vx) < EPSILON && Math.abs(vy) < EPSILON)
			return null;
		if (scaled) {
			const resized = resizeInstead(style, placement.a, placement.d, vx, vy);
			if (resized) return resized;
		}
		return {
			transform: (scaled
				? [...move, { scaleX: placement.a }, { scaleY: placement.d }]
				: move) as unknown as TransformArrayItem[],
		};
	}
	// A screen that turns: the element turns back by as much (blending two screens' scales can leave
	// a little shear, kept as a skew).
	const { rot, sx, sy, k } = decompose(placement);
	const skew =
		Math.abs(k) > EPSILON && sy !== 0
			? [{ skewX: `${Math.atan(k / sy)}rad` }]
			: [];
	return {
		transform: [
			...move,
			{ rotate: `${rot}rad` },
			...skew,
			{ scaleX: sx },
			{ scaleY: sy },
		] as unknown as TransformArrayItem[],
	};
};

/**
 * How much of a window rect a screen, drawn as `screen` says, covers (0 to 1, by its bounding box).
 * A screen whose size isn't known yet covers it all.
 */
export const screenCoverage = (screen: ScreenTransform, rect: FrameRect) => {
	"worklet";
	if (!screen.width || !screen.height) return 1;
	const area = boundingBox(
		{ pageX: 0, pageY: 0, width: screen.width, height: screen.height },
		toAffine(screen),
	);
	const w =
		Math.min(area.pageX + area.width, rect.pageX + rect.width) -
		Math.max(area.pageX, rect.pageX);
	const h =
		Math.min(area.pageY + area.height, rect.pageY + rect.height) -
		Math.max(area.pageY, rect.pageY);
	if (w <= 0 || h <= 0) return 0;
	const size = rect.width * rect.height;
	return size > 0 ? (w * h) / size : 1;
};

/** Whether a screen overlaps a window rect at all (see screenCoverage). */
const screenCovers = (screen: ScreenTransform, rect: FrameRect) => {
	"worklet";
	return screenCoverage(screen, rect) > 0;
};

/**
 * Whether the closing destination screen still covers the source's copy of a landed pair (its
 * window rect overlaps where the source draws the element: its slot, or wherever the element is in
 * flight when the source screen closes too). A screen whose size isn't known yet counts as covering.
 */
const coversSource = (
	frame: BoundsScreenFrame,
	read: (key: string) => ScreenTransform,
): boolean => {
	"worklet";
	return screenCovers(
		read(frame.destinationScreenKey),
		boundingBox(
			resolveStart(frame, read),
			toAffine(read(frame.sourceScreenKey)),
		),
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
		// A transform returned in place of the bounds one composes with it (after it, in the
		// element's own space): spreading `bounds().styles()` and adding a transform keeps the flight.
		// One that already starts with the bounds steps is composed already; an empty one opts out.
		const own = stripped.transform;
		const generated = frame.boundsTransform;
		if (
			Array.isArray(own) &&
			own.length > 0 &&
			Array.isArray(generated) &&
			!startsWithTransform(own, generated)
		) {
			stripped.transform = [
				...(generated as TransformArrayItem[]),
				...(own as TransformArrayItem[]),
			] as StyleProps["transform"];
		}
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
		if (correction?.replace) {
			stripped.transform = correction.transform as StyleProps["transform"];
			stripped.width = correction.width;
			stripped.height = correction.height;
		} else if (correction) {
			const transform = stripped.transform;
			stripped.transform = (
				Array.isArray(transform)
					? [...correction.transform, ...(transform as TransformArrayItem[])]
					: correction.transform
			) as StyleProps["transform"];
		}
		if (frame.fromLook || frame.toLook) {
			// Drawn at its true size under the scale the element ends up drawn at (its path's, the
			// correction's and any of the interpolator's own); keys the interpolator sets stay its own.
			const scale = transformScale(stripped.transform);
			const look = resolveVisualStyle(
				frame.fromLook,
				frame.toLook,
				frame.t,
				scale.x,
				scale.y,
				style as Record<string, unknown>,
			);
			if (look) {
				const hidden = stripped.opacity;
				for (const key in look) {
					(stripped as Record<string, unknown>)[key] = (
						look as Record<string, unknown>
					)[key];
				}
				// Hidden for an overlap (a copy another one draws) stays hidden.
				if (typeof hidden === "number" && typeof look.opacity === "number") {
					stripped.opacity = hidden * look.opacity;
				} else if (typeof hidden === "number") {
					stripped.opacity = hidden;
				}
			}
		}
		if (frame.landed && !coversSource(frame, read)) stripped.opacity = 0;
		next[slotId] = { ...slot, style: stripped, boundsPlaced: true };
	}
	return (next as NormalizedTransitionInterpolatedStyle | null) ?? stylesMap;
};
