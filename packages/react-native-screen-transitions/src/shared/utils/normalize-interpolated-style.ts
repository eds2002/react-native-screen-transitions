import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../types/animation.types";

/**
 * Normalizes an interpolator result into the canonical `{ style, props }` slot format.
 *
 * Handles three cases per key:
 * 1. Proper `TransitionSlotStyle` values (has `style` or `props` key) — pass through
 * 2. Style shorthand (plain StyleProps without wrapping) — auto-wrapped as `{ style: value }`
 */
export function normalizeInterpolatedStyle(
	raw: Record<string, any>,
): NormalizedTransitionInterpolatedStyle {
	"worklet";

	const normalized: Record<string, NormalizedTransitionSlotStyle | undefined> =
		{};

	for (const key in raw) {
		const value = raw[key];

		// ── All other keys ──
		if (value === undefined) {
			normalized[key] = undefined;
			continue;
		}

		if (typeof value === "object" && ("style" in value || "props" in value)) {
			// Proper TransitionSlotStyle — pass through
			normalized[key] = value;
		} else {
			// Shorthand: plain StyleProps — wrap it
			normalized[key] = { style: value };
		}
	}

	return normalized as NormalizedTransitionInterpolatedStyle;
}
