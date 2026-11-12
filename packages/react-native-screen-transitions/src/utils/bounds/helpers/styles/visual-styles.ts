import { interpolateColor, type StyleProps } from "react-native-reanimated";
import { STYLE_RESET_VALUES } from "../../../../providers/orchestrator/styles/constants";

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

/**
 * Colors do not travel (not in VISUAL_STYLE_KEYS, not picked): on iOS an animated background color
 * on the element is dropped for a frame when its frame returns from the overlay host, drawing it
 * without its background. Blend colors in the interpolator, on a view of your own, until the
 * element can carry them through that hand-back.
 */
const COLOR_KEYS = [
	"backgroundColor",
	"borderColor",
	"borderTopColor",
	"borderRightColor",
	"borderBottomColor",
	"borderLeftColor",
	"shadowColor",
] as const;

/** Drawn as is: not affected by the element's scale. */
const PLAIN_KEYS = ["opacity", "shadowOpacity"] as const;

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

/** The visual props of a style that travel with its boundary (everything else stays as laid out). */
export const pickVisualStyle = (
	style: Look | null | undefined,
): Look | null => {
	"worklet";
	if (!style) return null;
	let picked: Look | null = null;
	const take = (key: string) => {
		const value = style[key];
		if (value === undefined || value === null) return;
		if (!picked) picked = {};
		picked[key] = value;
	};
	for (const key of RADIUS_KEYS) take(key);
	for (const key of BORDER_WIDTH_KEYS) take(key);
	for (const key of PLAIN_KEYS) take(key);
	for (const key of SCALED_KEYS) take(key);
	take("shadowOffset");
	return picked;
};

const numberOr = (value: unknown, fallback: number) => {
	"worklet";
	return typeof value === "number" ? value : fallback;
};

const lerp = (a: number, b: number, t: number) => {
	"worklet";
	return a + (b - a) * t;
};

/**
 * The visual props of an element `t` of the way from `from` (the source's look) to `to` (the
 * destination's), for an element drawn at `scaleX` x `scaleY` of its laid-out box. Corners and
 * borders are one value for both axes, so under an uneven scale they are set for the mean of the two
 * (geometric): exact under an even scale, the nearest a single value gets otherwise.
 */
export const resolveVisualStyle = (
	from: Look | null | undefined,
	to: Look | null | undefined,
	t: number,
	scaleX: number,
	scaleY: number,
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
	const set = (key: string, value: unknown) => {
		if (!out) out = {};
		out[key] = value;
	};
	const has = (key: string) => a[key] !== undefined || b[key] !== undefined;

	// A corner side only one end sets falls back to that end's `borderRadius`, then to square.
	for (const key of RADIUS_KEYS) {
		if (!has(key)) continue;
		const fa = key === "borderRadius" ? 0 : numberOr(a.borderRadius, 0);
		const fb = key === "borderRadius" ? 0 : numberOr(b.borderRadius, 0);
		set(key, lerp(numberOr(a[key], fa), numberOr(b[key], fb), t) / s);
	}
	for (const key of BORDER_WIDTH_KEYS) {
		if (!has(key)) continue;
		const fa =
			key === "borderWidth" ? NEUTRAL_WIDTH : numberOr(a.borderWidth, 0);
		const fb =
			key === "borderWidth" ? NEUTRAL_WIDTH : numberOr(b.borderWidth, 0);
		set(key, lerp(numberOr(a[key], fa), numberOr(b[key], fb), t) / s);
	}
	// A color blends only between two set colors; a color one end leaves unset stays the other
	// end's (fading it through transparent would empty the element mid-flight).
	for (const key of COLOR_KEYS) {
		if (!has(key)) continue;
		const ca = (a[key] ??
			(key === "backgroundColor" ? undefined : a.borderColor)) as
			| string
			| undefined;
		const cb = (b[key] ??
			(key === "backgroundColor" ? undefined : b.borderColor)) as
			| string
			| undefined;
		// Nothing to blend: the element's own color stands (setting it anyway costs a frame when the
		// key is handed back to the static style).
		if (ca === undefined || cb === undefined || ca === cb) continue;
		set(key, interpolateColor(t, [0, 1], [ca, cb]));
	}
	for (const key of PLAIN_KEYS) {
		if (!has(key)) continue;
		const neutral = STYLE_RESET_VALUES[key] as number;
		set(key, lerp(numberOr(a[key], neutral), numberOr(b[key], neutral), t));
	}
	for (const key of SCALED_KEYS) {
		if (!has(key)) continue;
		set(key, lerp(numberOr(a[key], 0), numberOr(b[key], 0), t) / s);
	}
	if (has("shadowOffset")) {
		const oa = (a.shadowOffset ?? { width: 0, height: 0 }) as {
			width?: number;
			height?: number;
		};
		const ob = (b.shadowOffset ?? { width: 0, height: 0 }) as {
			width?: number;
			height?: number;
		};
		set("shadowOffset", {
			width: lerp(oa.width ?? 0, ob.width ?? 0, t) / sx,
			height: lerp(oa.height ?? 0, ob.height ?? 0, t) / sy,
		});
	}
	return out;
};
