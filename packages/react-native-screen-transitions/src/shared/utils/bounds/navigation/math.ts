import { clamp, interpolate } from "react-native-reanimated";

type CombinedScaleMode = "multiply" | "average" | "max" | "min";

const lerp = (from: number, to: number, t: number): number => {
	"worklet";
	return from + (to - from) * t;
};

const safeDivide = (
	numerator: number,
	denominator: number,
	fallback = 0,
): number => {
	"worklet";
	if (denominator === 0) return fallback;
	return numerator / denominator;
};

const inverseLerp = (value: number, inMin: number, inMax: number): number => {
	"worklet";
	return safeDivide(value - inMin, inMax - inMin, 0);
};

const mapRangeClamped = (
	value: number,
	inMin: number,
	inMax: number,
	outMin: number,
	outMax: number,
): number => {
	"worklet";
	const t = clamp(inverseLerp(value, inMin, inMax), 0, 1);
	return lerp(outMin, outMax, t);
};

const applyPowerCurve = (value: number, exponent: number): number => {
	"worklet";
	const safeExponent = exponent > 0 ? exponent : 1;
	const magnitude = Math.abs(value) ** safeExponent;
	return value < 0 ? -magnitude : magnitude;
};

const normalizedToScale = ({
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

const compensateTranslationForParentScale = ({
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
