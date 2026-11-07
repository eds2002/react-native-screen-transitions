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

const isAlreadyNormalized = (raw: Record<string, any>) => {
	"worklet";
	for (const key in raw) {
		const value = raw[key];
		if (value !== undefined && !isExplicitTransitionSlot(value)) {
			return false;
		}
	}
	return true;
};

/**
 * Normalizes an interpolator result into the canonical `{ style, props }` slot format: explicit
 * `TransitionSlotStyle` values (with a `style` or `props` key) pass through, and plain StyleProps
 * shorthand is wrapped as `{ style: value }`.
 */
export function normalizeSlots(
	raw: Record<string, any>,
): NormalizedTransitionInterpolatedStyle {
	"worklet";

	if (isAlreadyNormalized(raw)) {
		return raw as NormalizedTransitionInterpolatedStyle;
	}

	const normalized: Record<string, NormalizedTransitionSlotStyle | undefined> =
		{};

	for (const key in raw) {
		const value = raw[key];
		normalized[key] =
			value === undefined || isExplicitTransitionSlot(value)
				? value
				: { style: value };
	}

	return normalized as NormalizedTransitionInterpolatedStyle;
}
