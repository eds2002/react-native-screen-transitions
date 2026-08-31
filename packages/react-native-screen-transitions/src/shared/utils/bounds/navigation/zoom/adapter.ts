import type { SmoothClipPresentation } from "react-native-smooth-clip-view";
import { NAVIGATION_MASK_ELEMENT_STYLE_ID } from "../../../../constants";
import type {
	AnimatedViewStyle,
	TransitionSlotStyle,
} from "../../../../types/animation.types";
import { adaptBuiltInClipSlot } from "../clip/adapter";
import { markBuiltInClipPresentation } from "../clip/runtime-metadata";

type ZoomFocusedContentClipAdapterParams = Readonly<{
	projectedClip: SmoothClipPresentation | null;
	explicitClip?: SmoothClipPresentation;
	opacity?: number;
	rotation: number;
	legacyStyle: AnimatedViewStyle;
}>;

type ZoomNavigationMaskClipAdapterParams = Readonly<{
	projectedClip: SmoothClipPresentation | null;
	explicitClip?: SmoothClipPresentation;
	legacyStyle: AnimatedViewStyle;
}>;

/** Keeps only independently animated visual channels on the outer carrier. */
export function adaptZoomFocusedContentClip({
	projectedClip,
	explicitClip,
	opacity,
	rotation,
	legacyStyle,
}: ZoomFocusedContentClipAdapterParams): TransitionSlotStyle {
	"worklet";

	// A rotated outer carrier does not commute with SmoothClip's inner
	// translation. Keep the exact legacy T * S * R transform while rotation is
	// active. The trusted native plan also declares rotation as a promotion
	// blocker, so this path remains streamed/RN-owned for the transition.
	if (explicitClip === undefined && rotation !== 0) {
		return { style: legacyStyle };
	}

	return adaptBuiltInClipSlot({
		explicitClip,
		projectedClip:
			explicitClip === undefined && projectedClip !== null
				? markBuiltInClipPresentation(projectedClip, {
						activeBlockers:
							Math.abs(rotation) > 1e-7 ? (["rotation"] as const) : [],
						planId: "zoom",
						slotId: "content",
					})
				: projectedClip,
		legacyStyle,
		residualStyle: {
			...(opacity === undefined ? {} : { opacity }),
			transform: [{ rotateZ: `${rotation}rad` }],
		},
	});
}

export function adaptZoomNavigationMaskClip({
	projectedClip,
	explicitClip,
	legacyStyle,
}: ZoomNavigationMaskClipAdapterParams): TransitionSlotStyle {
	"worklet";

	return adaptBuiltInClipSlot({
		explicitClip,
		projectedClip:
			explicitClip === undefined && projectedClip !== null
				? markBuiltInClipPresentation(projectedClip, {
						activeBlockers: [],
						planId: "zoom",
						slotId: NAVIGATION_MASK_ELEMENT_STYLE_ID,
					})
				: projectedClip,
		legacyStyle,
	});
}
