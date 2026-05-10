export const resolveDirectionalDragTranslation = ({
	normalized,
	dimension,
	resistance,
	negativeMax,
	positiveMax,
	exponent = 1,
}: {
	normalized: number;
	dimension: number;
	resistance: number;
	negativeMax: number;
	positiveMax: number;
	exponent?: number;
}) => {
	"worklet";

	const clampedMagnitude = Math.min(1, Math.abs(normalized));
	const curvedMagnitude = clampedMagnitude ** Math.max(1, exponent);
	const baseDistance = Math.max(0, dimension) * resistance;

	if (normalized < 0) {
		return -baseDistance * negativeMax * curvedMagnitude;
	}

	return baseDistance * positiveMax * curvedMagnitude;
};
