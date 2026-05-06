import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../types/animation.types";

const isExplicitTransitionSlot = (value: unknown) => {
	"worklet";
	return (
		typeof value === "object" &&
		value != null &&
		("style" in value || "props" in value)
	);
};

const isAlreadyNormalizedStyleMap = (raw: Record<string, any>) => {
	"worklet";

	for (const key in raw) {
		const value = raw[key];

		if (value === undefined) {
			continue;
		}

		if (!isExplicitTransitionSlot(value)) {
			return false;
		}
	}

	return true;
};

/**
 * Normalizes an interpolator result into the canonical `{ style, props }` slot format.
 *
 * Handles three cases per key:
 * 1. Proper `TransitionSlotStyle` values (has `style` or `props` key) — pass through
 * 2. Style shorthand (plain StyleProps without wrapping) — auto-wrapped as `{ style: value }`
 */
export function normalizeSlots(
	raw: Record<string, any>,
): NormalizedTransitionInterpolatedStyle {
	"worklet";

	// Most modern interpolators already return the canonical `{ style, props }`
	// slot shape. In that common case, we can forward the raw object directly and
	// avoid building a second map just to copy the same slot references over.
	if (isAlreadyNormalizedStyleMap(raw)) {
		return raw as NormalizedTransitionInterpolatedStyle;
	}

	const normalized: Record<string, NormalizedTransitionSlotStyle | undefined> =
		{};

	for (const key in raw) {
		const value = raw[key];

		// ── All other keys ──
		if (value === undefined) {
			normalized[key] = undefined;
			continue;
		}

		if (isExplicitTransitionSlot(value)) {
			// Proper TransitionSlotStyle — pass through
			normalized[key] = value as NormalizedTransitionSlotStyle;
		} else {
			// Shorthand: plain StyleProps — wrap it
			normalized[key] = { style: value };
		}
	}

	return normalized as NormalizedTransitionInterpolatedStyle;
}
