import type {
	ClipCurve,
	SmoothClipPresentation,
} from "react-native-smooth-clip-view";
import type { Layout } from "../../../../types/screen.types";
import { projectCenteredAperture } from "../clip/projector";

type RevealContentClipProjectionParams = Readonly<{
	screenLayout: Layout;
	translateX: number;
	translateY: number;
	scale: number;
}>;

type RevealNavigationMaskClipProjectionParams = Readonly<{
	width: number;
	height: number;
	translateX: number;
	translateY: number;
	scale: number;
	radius: number;
	curve: ClipCurve;
}>;

/** Projects reveal's fixed screen footprint and content transform together. */
export function projectRevealContentClip({
	screenLayout,
	translateX,
	translateY,
	scale,
}: RevealContentClipProjectionParams): SmoothClipPresentation | null {
	"worklet";

	return projectCenteredAperture({
		aperture: {
			x: 0,
			y: 0,
			width: screenLayout.width,
			height: screenLayout.height,
			radius: 0,
			curve: "circular",
		},
		apertureTranslateX: translateX,
		apertureTranslateY: translateY,
		apertureScale: scale,
		contentTranslateX: translateX,
		contentTranslateY: translateY,
		contentScale: scale,
	});
}

/** Projects reveal's compensated nested mask into its fixed-host space. */
export function projectRevealNavigationMaskClip({
	width,
	height,
	translateX,
	translateY,
	scale,
	radius,
	curve,
}: RevealNavigationMaskClipProjectionParams): SmoothClipPresentation | null {
	"worklet";

	return projectCenteredAperture({
		aperture: {
			x: 0,
			y: 0,
			width,
			height,
			radius,
			curve,
		},
		apertureTranslateX: translateX,
		apertureTranslateY: translateY,
		apertureScale: scale,
		contentTranslateX: 0,
		contentTranslateY: 0,
		contentScale: 1,
	});
}
