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

export function normalizeSlots(
	raw: Record<string, any>,
): NormalizedTransitionInterpolatedStyle {
	"worklet";

	if (isAlreadyNormalizedStyleMap(raw)) {
		return raw as NormalizedTransitionInterpolatedStyle;
	}

	const normalized: Record<string, NormalizedTransitionSlotStyle | undefined> =
		{};

	for (const key in raw) {
		const value = raw[key];

		if (value === undefined) {
			normalized[key] = undefined;
			continue;
		}

		if (isExplicitTransitionSlot(value)) {
			normalized[key] = value as NormalizedTransitionSlotStyle;
		} else {
			normalized[key] = { style: value };
		}
	}

	return normalized as NormalizedTransitionInterpolatedStyle;
}
