import type {
	ClipCurve,
	SmoothClipPresentation,
} from "react-native-smooth-clip-view";

export type BuiltInClipRadii = Readonly<{
	radius: number;
	topLeftRadius?: number;
	topRightRadius?: number;
	bottomRightRadius?: number;
	bottomLeftRadius?: number;
}>;

export type CenteredApertureProjection = Readonly<{
	aperture: Readonly<{
		x: number;
		y: number;
		width: number;
		height: number;
		curve: ClipCurve;
	}> &
		BuiltInClipRadii;
	apertureTranslateX: number;
	apertureTranslateY: number;
	apertureScale: number;
	contentTranslateX: number;
	contentTranslateY: number;
	contentScale: number;
}>;

const isFiniteOptionalNumber = (value: number | undefined) => {
	"worklet";
	return value === undefined || Number.isFinite(value);
};

const scaleOptionalRadius = (value: number | undefined, scale: number) => {
	"worklet";
	return value === undefined ? undefined : value * scale;
};

/**
 * Projects the centered React Native transform of an aperture into the fixed
 * SmoothClip host coordinate space. Translation is deliberately independent
 * from scale, matching both RN's centered view transform and SmoothClip's
 * content-transform contract.
 */
export function projectCenteredAperture({
	aperture,
	apertureTranslateX,
	apertureTranslateY,
	apertureScale,
	contentTranslateX,
	contentTranslateY,
	contentScale,
}: CenteredApertureProjection): SmoothClipPresentation | null {
	"worklet";

	if (
		!Number.isFinite(aperture.x) ||
		!Number.isFinite(aperture.y) ||
		!Number.isFinite(aperture.width) ||
		!Number.isFinite(aperture.height) ||
		!Number.isFinite(aperture.radius) ||
		!isFiniteOptionalNumber(aperture.topLeftRadius) ||
		!isFiniteOptionalNumber(aperture.topRightRadius) ||
		!isFiniteOptionalNumber(aperture.bottomRightRadius) ||
		!isFiniteOptionalNumber(aperture.bottomLeftRadius) ||
		!Number.isFinite(apertureTranslateX) ||
		!Number.isFinite(apertureTranslateY) ||
		!Number.isFinite(apertureScale) ||
		apertureScale <= 0 ||
		!Number.isFinite(contentTranslateX) ||
		!Number.isFinite(contentTranslateY) ||
		!Number.isFinite(contentScale) ||
		contentScale <= 0
	) {
		return null;
	}

	const width = aperture.width * apertureScale;
	const height = aperture.height * apertureScale;
	const x = aperture.x + apertureTranslateX + (aperture.width - width) / 2;
	const y = aperture.y + apertureTranslateY + (aperture.height - height) / 2;

	return {
		clip: {
			x,
			y,
			width,
			height,
			radius: aperture.radius * apertureScale,
			topLeftRadius: scaleOptionalRadius(aperture.topLeftRadius, apertureScale),
			topRightRadius: scaleOptionalRadius(
				aperture.topRightRadius,
				apertureScale,
			),
			bottomRightRadius: scaleOptionalRadius(
				aperture.bottomRightRadius,
				apertureScale,
			),
			bottomLeftRadius: scaleOptionalRadius(
				aperture.bottomLeftRadius,
				apertureScale,
			),
			curve: aperture.curve,
		},
		contentTranslateX,
		contentTranslateY,
		contentScale,
	};
}
