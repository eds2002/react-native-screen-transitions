import type { GestureDirection } from "../../types";

/**
 * Utility function to normalize gesture translation based on direction.
 */
export const normalizeGestureTranslation = (
	translation: number,
	gestureDirection: GestureDirection,
) => {
	"worklet";
	const isInverted = gestureDirection.includes("inverted");

	const translated = Math.abs(translation) * (isInverted ? -1 : 1);

	if (isInverted) {
		return Math.min(0, translated);
	}

	return Math.max(0, translated);
};
