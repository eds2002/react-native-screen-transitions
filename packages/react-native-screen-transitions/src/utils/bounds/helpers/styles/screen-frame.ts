import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";

/**
 * What a bounds element style needs to stay one element while the screens it travels between move
 * (a slide, a parallax, a screen dragged by the finger). `bounds().styles()` computes the element's
 * path between the two measured rects as if neither screen moved; the screen's resolved styles then
 * read every screen's own transform for the same frame and correct the element (see
 * `applyBoundsScreenFrames`). Carried on the style under a private key and removed there.
 */
export const BOUNDS_SCREEN_FRAME_STYLE_KEY = "__screenTransitionsBoundsFrame";

export type BoundsScreenFrame = {
	/** How far along the source -> destination path the element is (0 at the source, 1 at the destination). */
	t: number;
	sourceScreenKey: string;
	destinationScreenKey: string;
	/** The screen whose interpolator styled this element (the element is drawn inside it). */
	screenKey: string;
	/** The transforms the source and destination screens had when their ends were measured. */
	sourceMeasuredWith?: MeasuredScreenTransform;
	destinationMeasuredWith?: MeasuredScreenTransform;
	/**
	 * How far the path's start is from the element's own box (the leaving copy, when the element
	 * leaves from where a sibling had it in flight rather than from its slot), in measured space.
	 */
	shiftX: number;
	shiftY: number;
	/** The element's own measured box (window space, measured with its end's screen transform). */
	x: number;
	y: number;
	width: number;
	height: number;
};

/** A screen's translate/scale when a boundary on it was measured (see bounds-screen-frames). */
export type MeasuredScreenTransform = {
	sx: number;
	sy: number;
	tx: number;
	ty: number;
	width: number;
	height: number;
};

type MeasuredWithTransform = MeasuredDimensions & {
	screenTransform?: MeasuredScreenTransform;
};

type StyleWithScreenFrame = StyleProps & {
	[BOUNDS_SCREEN_FRAME_STYLE_KEY]?: BoundsScreenFrame;
};

export const attachBoundsScreenFrame = (
	style: StyleProps,
	params: {
		shiftX: number;
		shiftY: number;
		t: number;
		sourceScreenKey: string | null | undefined;
		destinationScreenKey: string | null | undefined;
		screenKey: string | null | undefined;
		layout: MeasuredDimensions | null | undefined;
		sourceMeasured: MeasuredDimensions | null | undefined;
		destinationMeasured: MeasuredDimensions | null | undefined;
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
		t: params.t,
		shiftX: params.shiftX,
		shiftY: params.shiftY,
		sourceScreenKey,
		destinationScreenKey,
		screenKey,
		sourceMeasuredWith: (params.sourceMeasured as MeasuredWithTransform | null)
			?.screenTransform,
		destinationMeasuredWith: (
			params.destinationMeasured as MeasuredWithTransform | null
		)?.screenTransform,
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
