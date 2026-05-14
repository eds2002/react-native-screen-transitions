export const resolveDirectionalDragTranslation = ({
	translation,
	dimension,
	negativeMax,
	positiveMax,
	exponent = 1,
}: {
	translation: number;
	dimension: number;
	negativeMax: number;
	positiveMax: number;
	exponent?: number;
}) => {
	"worklet";

	const baseDistance = Math.max(1, dimension);
	const clampedMagnitude = Math.min(1, Math.abs(translation) / baseDistance);
	const curvedMagnitude = clampedMagnitude ** Math.max(1, exponent);

	if (translation < 0) {
		return -baseDistance * negativeMax * curvedMagnitude;
	}

	return baseDistance * positiveMax * curvedMagnitude;
};
