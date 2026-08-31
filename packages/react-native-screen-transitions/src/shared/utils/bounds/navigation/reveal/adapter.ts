import type { SmoothClipPresentation } from "react-native-smooth-clip-view";
import { NAVIGATION_MASK_ELEMENT_STYLE_ID } from "../../../../constants";
import type {
	AnimatedViewStyle,
	TransitionSlotStyle,
} from "../../../../types/animation.types";
import { adaptBuiltInClipSlot } from "../clip/adapter";
import { markBuiltInClipPresentation } from "../clip/runtime-metadata";

type RevealClipAdapterParams = Readonly<{
	projectedClip: SmoothClipPresentation | null;
	explicitClip?: SmoothClipPresentation;
	legacyStyle: AnimatedViewStyle;
	residualStyle?: AnimatedViewStyle;
}>;

/** Leaves reveal's opacity and shadow channels on the outer visual carrier. */
export function adaptRevealFocusedContentClip({
	projectedClip,
	explicitClip,
	legacyStyle,
	residualStyle,
}: RevealClipAdapterParams): TransitionSlotStyle {
	"worklet";

	return adaptBuiltInClipSlot({
		explicitClip,
		projectedClip:
			explicitClip === undefined && projectedClip !== null
				? markBuiltInClipPresentation(projectedClip, {
						activeBlockers: [],
						planId: "reveal",
						slotId: "content",
					})
				: projectedClip,
		legacyStyle,
		residualStyle,
	});
}

export function adaptRevealNavigationMaskClip({
	projectedClip,
	explicitClip,
	legacyStyle,
}: RevealClipAdapterParams): TransitionSlotStyle {
	"worklet";

	return adaptBuiltInClipSlot({
		explicitClip,
		projectedClip:
			explicitClip === undefined && projectedClip !== null
				? markBuiltInClipPresentation(projectedClip, {
						activeBlockers: [],
						planId: "reveal",
						slotId: NAVIGATION_MASK_ELEMENT_STYLE_ID,
					})
				: projectedClip,
		legacyStyle,
	});
}
