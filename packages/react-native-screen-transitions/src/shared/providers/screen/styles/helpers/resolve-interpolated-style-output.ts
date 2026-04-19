import { NO_STYLES } from "../../../../constants";
import type {
	NormalizedTransitionInterpolatedStyle,
	TransitionInterpolatedStyle,
} from "../../../../types/animation.types";
import { normalizeInterpolatedStyle } from "../../../../utils/normalize-interpolated-style";

export type ResolvedInterpolatedStyleOutput = {
	stylesMap: NormalizedTransitionInterpolatedStyle;
	wasLegacy: boolean;
};

export const resolveInterpolatedStyleOutput = (
	raw: TransitionInterpolatedStyle | null | undefined,
): ResolvedInterpolatedStyleOutput => {
	"worklet";

	if (raw == null || typeof raw !== "object") {
		return {
			stylesMap: NO_STYLES,
			wasLegacy: false,
		};
	}

	const { result, wasLegacy } = normalizeInterpolatedStyle(raw);

	return {
		stylesMap: result,
		wasLegacy,
	};
};
