import type { StyleProps } from "react-native-reanimated";
import { STYLE_RESET_VALUES } from "../../../../style-reset-values";

/**
 * A boundary's look travels with it: the visual props its two ends set (corners, border widths,
 * opacity, shadow) go from the source's values to the destination's as it flies, and are drawn at
 * their true size whatever the element's scale. The element is laid out at one end's size and scaled
 * to the other's, and a scale scales its corners and borders too, so those are divided by the scale it
 * is drawn at. A prop only one end sets goes to or from its neutral value (STYLE_RESET_VALUES).
 */

const RADIUS_KEYS = [
	"borderRadius",
	"borderTopLeftRadius",
	"borderTopRightRadius",
	"borderBottomRightRadius",
	"borderBottomLeftRadius",
	"borderTopStartRadius",
	"borderTopEndRadius",
	"borderBottomStartRadius",
	"borderBottomEndRadius",
] as const;

const BORDER_WIDTH_KEYS = [
	"borderWidth",
	"borderTopWidth",
	"borderRightWidth",
	"borderBottomWidth",
	"borderLeftWidth",
	"borderStartWidth",
	"borderEndWidth",
] as const;

/*
 * Colors do not travel: on iOS an animated background color on the element is dropped for a frame
 * when its frame returns from the overlay host, drawing it without its background. Blend colors in
 * the interpolator, on a view of your own, until the element can carry them through that hand-back.
 */

/** Scaled with the element, like corners. */
const SCALED_KEYS = ["shadowRadius"] as const;

type Look = Record<string, unknown>;

/**
 * The keys of a look that belong on the element itself: while its frame flies in an overlay host,
 * the host takes the move (transform) and the element keeps its look. Opacity stays with the host,
 * as before: it is also how a copy another one draws is hidden, and that hand-off and the frame's
 * return from the host land on the same frame only if the host owns it.
 */
export const VISUAL_STYLE_KEYS: Record<string, true> = {};
for (const key of [
	...RADIUS_KEYS,
	...BORDER_WIDTH_KEYS,
	"shadowOpacity",
	...SCALED_KEYS,
	"shadowOffset",
]) {
	VISUAL_STYLE_KEYS[key] = true;
}

/** A slot style without its look (what an overlay host around the element applies). */
export const omitVisualStyle = (style: Look): Look => {
	"worklet";
	let out: Look | null = null;
	for (const key in style) {
		if (VISUAL_STYLE_KEYS[key]) {
			if (!out) {
				out = {};
				for (const k in style) if (!VISUAL_STYLE_KEYS[k]) out[k] = style[k];
			}
			return out;
		}
	}
	return style;
};

const NEUTRAL_WIDTH = 0;

/** The key a corner or side falls back to when an element's style doesn't set it. */
const SHORTHAND_OF: Record<string, string> = {};
for (const key of RADIUS_KEYS)
	if (key !== "borderRadius") SHORTHAND_OF[key] = "borderRadius";
for (const key of BORDER_WIDTH_KEYS)
	if (key !== "borderWidth") SHORTHAND_OF[key] = "borderWidth";

/**
 * The value a style key rests at on an element whose own style is `base`: what it draws once an
 * animated style stops setting the key. A corner or side the base doesn't set takes its shorthand
 * (a card with `borderRadius: 28` rests at 28 in every corner); otherwise the neutral value.
 */
export const restingStyleValue = (
	key: string,
	base: Record<string, unknown>,
): unknown => {
	"worklet";
	const own = base[key];
	if (own !== undefined && own !== null) return own;
	const shorthand = SHORTHAND_OF[key];
	if (shorthand !== undefined) {
		const value = base[shorthand];
		if (value !== undefined && value !== null) return value;
	}
	const neutral = STYLE_RESET_VALUES[key];
	if (neutral !== undefined) return neutral;
	return key === "borderWidth" || SHORTHAND_OF[key] === "borderWidth"
		? NEUTRAL_WIDTH
		: undefined;
};

/**
 * The visual props of a style that travel with its boundary (everything else stays as laid out),
 * picked once when an end is measured. A shadow offset is copied: it is the one object a look holds.
 */
export const pickVisualStyle = (
	style: Look | null | undefined,
): Look | null => {
	"worklet";
	if (!style) return null;
	let picked: Look | null = null;
	for (const key in style) {
		if (!VISUAL_STYLE_KEYS[key] && key !== "opacity") continue;
		const value = style[key];
		if (value === undefined || value === null) continue;
		if (!picked) picked = {};
		if (key === "shadowOffset") {
			const offset = value as { width?: unknown; height?: unknown };
			picked[key] = { width: offset.width, height: offset.height };
		} else picked[key] = value;
	}
	return picked;
};

/** A value one end gives a key: a number, absent (undefined), or one that can't blend (NaN). */
const endValue = (look: Look, key: string, shorthand: string | undefined) => {
	"worklet";
	let value = look[key];
	if ((value === undefined || value === null) && shorthand !== undefined)
		value = look[shorthand];
	if (value === undefined || value === null) return undefined;
	return typeof value === "number" ? value : Number.NaN;
};

const lerp = (a: number, b: number, t: number) => {
	"worklet";
	return a + (b - a) * t;
};

/** How much a transform scales what it draws, per axis (a rotation keeps the size). */
export const transformScale = (
	transform: unknown,
): { x: number; y: number } => {
	"worklet";
	let x = 1;
	let y = 1;
	if (!Array.isArray(transform)) return { x, y };
	for (let i = 0; i < transform.length; i++) {
		const step = transform[i] as Record<string, unknown> | null;
		if (!step) continue;
		if (typeof step.scale === "number") {
			x *= step.scale;
			y *= step.scale;
		}
		if (typeof step.scaleX === "number") x *= step.scaleX;
		if (typeof step.scaleY === "number") y *= step.scaleY;
	}
	return { x, y };
};

/**
 * The visual props of an element `t` of the way from `from` (the source's look) to `to` (the
 * destination's), for an element its transform scales by `scaleX` x `scaleY`. Corners, borders and
 * shadow blur are divided by that scale so they draw at their true size; under an uneven scale a
 * single value can't be exact for both axes, so they take the mean of the two (geometric).
 * A key only one end sets goes to or from its neutral value; a corner or side an end leaves unset
 * takes that end's shorthand. A key either end sets to something that can't blend (a percentage
 * radius) is left out, so the element keeps its own. `skip` holds keys the caller sets itself (its
 * own corners or shadow win); opacity is always resolved, for the caller to multiply with its own.
 */
export const resolveVisualStyle = (
	from: Look | null | undefined,
	to: Look | null | undefined,
	t: number,
	scaleX: number,
	scaleY: number,
	skip?: Look,
): StyleProps | null => {
	"worklet";
	if (!from && !to) return null;
	if (!Number.isFinite(t)) return null;
	t = Math.min(1, Math.max(0, t));
	const a = from ?? {};
	const b = to ?? {};
	const sx = Math.abs(scaleX) > 1e-6 ? Math.abs(scaleX) : 1;
	const sy = Math.abs(scaleY) > 1e-6 ? Math.abs(scaleY) : 1;
	const s = Math.sqrt(sx * sy);
	let out: Record<string, unknown> | null = null;
	for (const key in VISUAL_STYLE_KEYS) {
		if (skip && key in skip) continue;
		if (key === "shadowOffset") continue;
		const own = a[key] !== undefined || b[key] !== undefined;
		if (!own) continue;
		const shorthand = SHORTHAND_OF[key];
		const va = endValue(a, key, shorthand);
		const vb = endValue(b, key, shorthand);
		const neutral = key === "shadowOpacity" ? 0 : NEUTRAL_WIDTH; // radius, width, blur: 0
		const x = va === undefined ? neutral : va;
		const y = vb === undefined ? neutral : vb;
		if (Number.isNaN(x) || Number.isNaN(y)) continue;
		const value = lerp(x, y, t);
		if (!out) out = {};
		out[key] = key === "shadowOpacity" ? value : value / s;
	}
	// Opacity isn't skipped: the caller multiplies it with its own (a hidden copy stays hidden).
	if (a.opacity !== undefined || b.opacity !== undefined) {
		const x = endValue(a, "opacity", undefined);
		const y = endValue(b, "opacity", undefined);
		const ox = x === undefined ? 1 : x;
		const oy = y === undefined ? 1 : y;
		if (!Number.isNaN(ox) && !Number.isNaN(oy)) {
			if (!out) out = {};
			out.opacity = lerp(ox, oy, t);
		}
	}
	if (!(skip && "shadowOffset" in skip) && (a.shadowOffset || b.shadowOffset)) {
		const oa = (a.shadowOffset ?? {}) as { width?: unknown; height?: unknown };
		const ob = (b.shadowOffset ?? {}) as { width?: unknown; height?: unknown };
		const n = (v: unknown) => (typeof v === "number" ? v : 0);
		if (!out) out = {};
		out.shadowOffset = {
			width: lerp(n(oa.width), n(ob.width), t) / sx,
			height: lerp(n(oa.height), n(ob.height), t) / sy,
		};
	}
	return out;
};
