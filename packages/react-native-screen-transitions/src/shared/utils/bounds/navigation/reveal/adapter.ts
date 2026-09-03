import type { SmoothClipPresentation } from "react-native-smooth-clip-view";
import { NAVIGATION_MASK_ELEMENT_STYLE_ID } from "../../../../constants";
import type {
	AnimatedViewStyle,
	TransitionSlotStyle,
} from "../../../../types/animation.types";
import { adaptBuiltInClipSlot } from "../clip/adapter";
import { markBuiltInClipPresentation } from "../clip/runtime-metadata";

type RevealClipAdapterParams = Readonly<{
	endpointClips?: Readonly<Partial<Record<"0" | "1", SmoothClipPresentation>>>;
	projectedClip: SmoothClipPresentation | null;
	explicitClip?: SmoothClipPresentation;
	legacyStyle: AnimatedViewStyle;
	residualStyle?: AnimatedViewStyle;
}>;

/** Leaves only reveal opacity on the outer visual carrier. */
export function adaptRevealFocusedContentClip({
	endpointClips,
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
						endpoints: endpointClips,
						planId: "reveal",
						slotId: "content",
					})
				: projectedClip,
		legacyStyle,
		residualStyle,
	});
}

export function adaptRevealNavigationMaskClip({
	endpointClips,
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
						endpoints: endpointClips,
						planId: "reveal",
						slotId: NAVIGATION_MASK_ELEMENT_STYLE_ID,
					})
				: projectedClip,
		legacyStyle,
	});
}
