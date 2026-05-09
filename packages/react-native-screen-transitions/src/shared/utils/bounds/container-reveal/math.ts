import { interpolate } from "react-native-reanimated";

export type CombinedScaleMode = "multiply" | "average" | "max" | "min";

export const clamp = (value: number, min: number, max: number): number => {
	"worklet";
	const lower = min < max ? min : max;
	const upper = max > min ? max : min;

	if (value < lower) return lower;
	if (value > upper) return upper;

	return value;
};

export const clamp01 = (value: number): number => {
	"worklet";
	return clamp(value, 0, 1);
};

export const lerp = (from: number, to: number, t: number): number => {
	"worklet";
	return from + (to - from) * t;
};

export const safeDivide = (
	numerator: number,
	denominator: number,
	fallback = 0,
): number => {
	"worklet";
	if (denominator === 0) return fallback;
	return numerator / denominator;
};

export const inverseLerp = (
	value: number,
	inMin: number,
	inMax: number,
): number => {
	"worklet";
	return safeDivide(value - inMin, inMax - inMin, 0);
};

export const mapRangeClamped = (
	value: number,
	inMin: number,
	inMax: number,
	outMin: number,
	outMax: number,
): number => {
	"worklet";
	const t = clamp01(inverseLerp(value, inMin, inMax));
	return lerp(outMin, outMax, t);
};

export const applyPowerCurve = (value: number, exponent: number): number => {
	"worklet";
	const safeExponent = exponent > 0 ? exponent : 1;
	const magnitude = Math.abs(value) ** safeExponent;
	return value < 0 ? -magnitude : magnitude;
};

export const normalizedToScale = ({
	normalized,
	outputRange,
	exponent = 1,
	positiveOnly = true,
}: {
	normalized: number;
	outputRange: readonly [number, number];
	exponent?: number;
	positiveOnly?: boolean;
}): number => {
	"worklet";
	const [outputStart, outputEnd] = outputRange;
	const raw = positiveOnly
		? mapRangeClamped(normalized, 0, 1, outputStart, outputEnd)
		: mapRangeClamped(normalized, -1, 1, outputStart, outputEnd);

	return applyPowerCurve(raw, exponent);
};

export const combineScales = (
	scaleX: number,
	scaleY: number,
	mode: CombinedScaleMode = "multiply",
): number => {
	"worklet";

	switch (mode) {
		case "average":
			return (scaleX + scaleY) / 2;
		case "max":
			return Math.max(scaleX, scaleY);
		case "min":
			return Math.min(scaleX, scaleY);
		default:
			return scaleX * scaleY;
	}
};

export const computeCenterScaleShift = ({
	center,
	containerCenter,
	scale,
}: {
	center: number;
	containerCenter: number;
	scale: number;
}): number => {
	"worklet";
	return (center - containerCenter) * (scale - 1);
};

export const compensateTranslationForParentScale = ({
	translation,
	parentScale,
	epsilon,
}: {
	translation: number;
	parentScale: number;
	epsilon: number;
}): number => {
	"worklet";
	const safeParentScale = Math.max(parentScale, epsilon);
	return safeDivide(translation, safeParentScale, translation);
};

export const composeCompensatedTranslation = ({
	gesture,
	parentScale,
	centerShift = 0,
	epsilon,
}: {
	gesture: number;
	parentScale: number;
	centerShift?: number;
	epsilon: number;
}): number => {
	"worklet";
	return (
		compensateTranslationForParentScale({
			translation: gesture,
			parentScale,
			epsilon,
		}) + centerShift
	);
};

export const resolveDirectionalDragScale = ({
	normalized,
	dismissDirection,
	shrinkMin,
	growMax,
	exponent,
}: {
	normalized: number;
	dismissDirection: "positive" | "negative";
	shrinkMin: number;
	growMax: number;
	exponent: number;
}) => {
	"worklet";

	const dismissalRelative =
		dismissDirection === "negative" ? -normalized : normalized;

	if (dismissalRelative >= 0) {
		return normalizedToScale({
			normalized: dismissalRelative,
			outputRange: [1, shrinkMin],
			exponent,
		});
	}

	const oppositeDrag = Math.min(1, Math.abs(dismissalRelative));
	return interpolate(oppositeDrag, [0, 1], [1, growMax], "clamp");
};

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

export const resolveOpacityRangeTuple = ({
	value,
	fallback,
}: {
	value:
		| readonly [
				inputStart: number,
				inputEnd: number,
				outputStart?: number,
				outputEnd?: number,
		  ]
		| undefined;
	fallback: readonly [
		inputStart: number,
		inputEnd: number,
		outputStart?: number,
		outputEnd?: number,
	];
}) => {
	"worklet";

	return {
		inputStart: value?.[0] ?? fallback[0],
		inputEnd: value?.[1] ?? fallback[1],
		outputStart: value?.[2] ?? fallback[2] ?? 0,
		outputEnd: value?.[3] ?? fallback[3] ?? 1,
	};
};
