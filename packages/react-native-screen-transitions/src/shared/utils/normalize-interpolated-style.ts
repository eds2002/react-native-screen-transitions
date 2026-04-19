import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../types/animation.types";

/**
 * Normalizes an interpolator result into the canonical `{ style, props }` slot format.
 *
 * Handles three cases per key:
 * 1. Legacy renamed keys (`contentStyle` → `content`, `backdropStyle` → `backdrop`)
 * 2. Proper `TransitionSlotStyle` values (has `style` or `props` key) — pass through
 * 3. Style shorthand (plain StyleProps without wrapping) — auto-wrapped as `{ style: value }`
 *
 * Mixed-format objects (e.g. new-format spread + a legacy `backdropStyle` key) are
 * handled correctly because each key is processed individually.
 */
export function normalizeInterpolatedStyle(raw: Record<string, any>): {
	result: NormalizedTransitionInterpolatedStyle;
	wasLegacy: boolean;
} {
	"worklet";

	const hasLegacyKeys =
		"contentStyle" in raw || "backdropStyle" in raw || "overlayStyle" in raw;

	const normalized: Record<string, NormalizedTransitionSlotStyle | undefined> =
		{};

	for (const key in raw) {
		const value = raw[key];

		// ── Legacy key renames ──
		if (key === "contentStyle") {
			if (value !== undefined) normalized.content = { style: value };
			continue;
		}
		if (key === "backdropStyle") {
			if (value !== undefined) normalized.backdrop = { style: value };
			continue;
		}
		if (key === "overlayStyle") {
			if (value !== undefined && !normalized.backdrop) {
				normalized.backdrop = { style: value };
			}
			continue;
		}

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

	return {
		result: normalized as NormalizedTransitionInterpolatedStyle,
		wasLegacy: hasLegacyKeys,
	};
}
