import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../types/animation.types";
import {
	getBoundsLocalTransform,
	stripBoundsLocalTransform,
} from "../../../../utils/bounds/helpers/styles/local-transform";

const isExplicitTransitionSlot = (value: unknown) => {
	"worklet";
	return (
		typeof value === "object" &&
		value != null &&
		("style" in value || "props" in value)
	);
};

const hasBoundsLocalTransformMarker = (style: unknown) => {
	"worklet";
	return !!getBoundsLocalTransform(style as any)?.length;
};

const isAlreadyNormalizedStyleMapWithoutBoundsMetadata = (
	raw: Record<string, any>,
) => {
	"worklet";

	for (const key in raw) {
		const value = raw[key];

		if (value === undefined) {
			continue;
		}

		if (!isExplicitTransitionSlot(value)) {
			return false;
		}

		if (
			hasBoundsLocalTransformMarker(
				(value as NormalizedTransitionSlotStyle).style,
			)
		) {
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

	if (isAlreadyNormalizedStyleMapWithoutBoundsMetadata(raw)) {
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
			const explicitSlot = value as NormalizedTransitionSlotStyle;
			const boundsLocalTransform = getBoundsLocalTransform(explicitSlot.style);

			if (!boundsLocalTransform?.length) {
				normalized[key] = explicitSlot;
				continue;
			}

			normalized[key] = {
				style: explicitSlot.style
					? stripBoundsLocalTransform(explicitSlot.style)
					: undefined,
				props: explicitSlot.props,
				boundsLocalTransform,
			};
		} else {
			const boundsLocalTransform = getBoundsLocalTransform(value);
			const style =
				boundsLocalTransform?.length && value
					? stripBoundsLocalTransform(value)
					: value;

			// Shorthand: plain StyleProps — wrap it
			normalized[key] = boundsLocalTransform?.length
				? { style, boundsLocalTransform }
				: { style };
		}
	}

	return normalized as NormalizedTransitionInterpolatedStyle;
}
