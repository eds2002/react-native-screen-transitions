import type { StyleProps, TransformArrayItem } from "react-native-reanimated";
import {
	getResolvedLink,
	getScreenScroll,
	getScreenTransform,
} from "../../../../stores/bounds";
import {
	getScrollChainAxisDelta,
	getVisualScrollAxisDelta,
} from "../../../../stores/scroll.store";
import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../types/animation.types";
import {
	blend,
	compose,
	IDENTITY_SCREEN_TRANSFORM,
	invert,
	isIdentity,
	lerpRect,
	mapRect,
	rectToRect,
	type ScreenTransform,
	toAffine,
	toLayoutSpace,
	UNIT,
} from "../screen-transform";
import {
	BOUNDS_SCREEN_FRAME_STYLE_KEY,
	type BoundsScreenFrame,
	type FrameRect,
	getBoundsScreenFrame,
	type MeasuredScroll,
} from "./screen-frame";

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

type MeasuredRect = FrameRect & {
	screenTransform?: ScreenTransform;
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
 * window rect overlaps where the source draws the element: its slot, or wherever the element is in
 * flight when the source screen closes too). A screen whose size isn't known yet counts as covering.
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
	const source = mapRect(
		resolveStart(frame, read),
		toAffine(read(frame.sourceScreenKey)),
	);
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
