import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type { MeasuredBounds } from "../../../../types/bounds.types";
import type { FrameRect } from "../../types/geometry";

/**
 * What a bounds element style needs to stay one element while the screens it travels between move
 * (a slide, a parallax, a screen dragged by the finger) and while transitions overlap (spam, a
 * chain pushed or popped quickly). `bounds().styles()` composes the element's path where the screens
 * lay it out, from its source slot; the screen's resolved styles then place it for this frame (see
 * `applyBoundsScreenFrames`): where the two screens show its ends right now, starting from wherever
 * the element is drawn if it is in flight elsewhere. Carried on the style under a private key and
 * removed there.
 */
export const BOUNDS_SCREEN_FRAME_STYLE_KEY = "__screenTransitionsBoundsFrame";

/**
 * A pair whose element another pair starts from (see resolveStartChain): an older screen still
 * closing that draws it, or the source screen's own pair still moving (a chain).
 */
export type StartPair = {
	pairKey: string;
	source: string;
	destination: string;
	/** Its destination's progress this frame. */
	t: number;
};

/**
 * The scroll positions a measured rect was taken at: the scrollables around it (by id) and its
 * screen's scroll state. A rect measured inside a list that has scrolled since is drawn where the
 * scroll moved it (see applyBoundsScreenFrames). Null for a rect that was not measured (a custom target).
 */
/** The scroll positions around a box when it was measured (see MeasuredBounds); null if none. */
export type MeasuredScroll = Pick<
	MeasuredBounds,
	"scroll" | "scrollChain"
> | null;

export type BoundsScreenFrame = {
	/** The bound's tag (to read the start pairs' links). */
	tag: string;
	/** How far along the source -> destination path the element is (0 at the source, 1 at the destination). */
	t: number;
	sourceScreenKey: string;
	destinationScreenKey: string;
	/** The screen whose interpolator styled this element (the element is drawn inside it). */
	screenKey: string;
	/** The path the element's style was composed for, where the screens lay it out. */
	start: FrameRect;
	end: FrameRect;
	/** The pairs the element starts from instead of `start` (nearest first), when it is in flight. */
	startChain: StartPair[];
	/** A closing destination's copy within 2 px of the source's (see compute). */
	landed: boolean;
	/** The scroll positions `start`, `end` and the element's own box were measured at. */
	startScroll: MeasuredScroll;
	endScroll: MeasuredScroll;
	ownScroll: MeasuredScroll;
	/** The element's own box where its screen lays it out. */
	x: number;
	y: number;
	width: number;
	height: number;
};

type StyleWithScreenFrame = StyleProps & {
	[BOUNDS_SCREEN_FRAME_STYLE_KEY]?: BoundsScreenFrame;
};

export const scrollOf = (
	rect: MeasuredBounds | null | undefined,
): MeasuredScroll => {
	"worklet";
	if (!rect || (!rect.scrollChain && !rect.scroll)) return null;
	return { scrollChain: rect.scrollChain, scroll: rect.scroll };
};

export const attachBoundsScreenFrame = (
	style: StyleProps,
	params: {
		tag: string;
		t: number;
		sourceScreenKey: string | null | undefined;
		destinationScreenKey: string | null | undefined;
		screenKey: string | null | undefined;
		layout: MeasuredDimensions | null | undefined;
		start: MeasuredDimensions;
		end: MeasuredDimensions;
		startChain: StartPair[];
		landed?: boolean;
	},
): StyleProps => {
	"worklet";
	const { sourceScreenKey, destinationScreenKey, screenKey, layout } = params;
	if (!sourceScreenKey || !destinationScreenKey || !screenKey || !layout) {
		return style;
	}
	const next: Record<string, unknown> = {};
	const source = style as Record<string, unknown>;
	for (const key in source) next[key] = source[key];
	next[BOUNDS_SCREEN_FRAME_STYLE_KEY] = {
		tag: params.tag,
		t: params.t,
		sourceScreenKey,
		destinationScreenKey,
		screenKey,
		start: {
			pageX: params.start.pageX,
			pageY: params.start.pageY,
			width: params.start.width,
			height: params.start.height,
		},
		end: {
			pageX: params.end.pageX,
			pageY: params.end.pageY,
			width: params.end.width,
			height: params.end.height,
		},
		startChain: params.startChain,
		landed: !!params.landed,
		startScroll: scrollOf(params.start),
		endScroll: scrollOf(params.end),
		ownScroll: scrollOf(layout),
		x: layout.pageX,
		y: layout.pageY,
		width: layout.width,
		height: layout.height,
	} satisfies BoundsScreenFrame;
	return next as StyleProps;
};

export const getBoundsScreenFrame = (
	style: StyleProps | undefined,
): BoundsScreenFrame | undefined => {
	"worklet";
	if (!style) return undefined;
	return (style as StyleWithScreenFrame)[BOUNDS_SCREEN_FRAME_STYLE_KEY];
};
