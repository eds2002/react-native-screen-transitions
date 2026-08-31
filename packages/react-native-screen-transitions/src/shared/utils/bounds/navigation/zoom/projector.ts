import type { SmoothClipPresentation } from "react-native-smooth-clip-view";
import type { Layout } from "../../../../types/screen.types";
import { projectCenteredAperture } from "../clip/projector";

type ZoomContentClipProjectionParams = Readonly<{
	screenLayout: Layout;
	translateX: number;
	translateY: number;
	scale: number;
	radius: number;
}>;

type ZoomNavigationMaskClipProjectionParams = Readonly<{
	width: number;
	height: number;
	translateX: number;
	translateY: number;
	scale: number;
	radius: number;
}>;

/** Projects zoom's former focused-content overflow view into host space. */
export function projectZoomContentClip({
	screenLayout,
	translateX,
	translateY,
	scale,
	radius,
}: ZoomContentClipProjectionParams): SmoothClipPresentation | null {
	"worklet";

	return projectCenteredAperture({
		aperture: {
			x: 0,
			y: 0,
			width: screenLayout.width,
			height: screenLayout.height,
			radius,
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

/** Projects the nested navigation mask in its own fixed-host coordinates. */
export function projectZoomNavigationMaskClip({
	width,
	height,
	translateX,
	translateY,
	scale,
	radius,
}: ZoomNavigationMaskClipProjectionParams): SmoothClipPresentation | null {
	"worklet";

	return projectCenteredAperture({
		aperture: {
			x: 0,
			y: 0,
			width,
			height,
			radius,
			curve: "continuous",
		},
		apertureTranslateX: translateX,
		apertureTranslateY: translateY,
		apertureScale: scale,
		contentTranslateX: 0,
		contentTranslateY: 0,
		contentScale: 1,
	});
}
