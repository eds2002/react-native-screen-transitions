import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../types/animation.types";

/** Normalizes style shorthand into the canonical `{ style, props }` slots. */
export function normalizeInterpolatedStyle(
	raw: Record<string, any>,
): NormalizedTransitionInterpolatedStyle {
	"worklet";

	const normalized: Record<string, NormalizedTransitionSlotStyle | undefined> =
		{};

	for (const key in raw) {
		const value = raw[key];

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
