/**
 * Utility function to map raw gesture translation to a progress value.
 */
export const mapGestureToProgress = (
	translation: number,
	dimension: number,
) => {
	"worklet";
	const rawProgress = translation / dimension;
	return Math.max(0, Math.min(1, rawProgress));
};
