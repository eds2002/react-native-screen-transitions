import type { SmoothClipPresentation } from "react-native-smooth-clip-view";
import type {
	AnimatedViewStyle,
	TransitionSlotStyle,
} from "../../../../types/animation.types";

export type BuiltInClipSlotAdapterParams = Readonly<{
	/** A caller-owned presentation always replaces the complete projection. */
	explicitClip?: SmoothClipPresentation;
	projectedClip: SmoothClipPresentation | null;
	residualStyle?: AnimatedViewStyle;
	legacyStyle: AnimatedViewStyle;
}>;

/**
 * Selects a whole-object clip before removing its geometric RN style. Invalid
 * built-in geometry keeps the complete legacy style as an atomic fallback.
 */
export function adaptBuiltInClipSlot({
	explicitClip,
	projectedClip,
	residualStyle,
	legacyStyle,
}: BuiltInClipSlotAdapterParams): TransitionSlotStyle {
	"worklet";

	const clip = explicitClip ?? projectedClip;
	if (clip === null) {
		return { style: legacyStyle };
	}

	return {
		clip,
		...(residualStyle === undefined ? {} : { style: residualStyle }),
	};
}
