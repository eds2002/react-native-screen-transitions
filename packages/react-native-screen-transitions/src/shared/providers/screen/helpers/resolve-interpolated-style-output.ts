import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import { normalizeInterpolatedStyle } from "../../../utils/normalize-interpolated-style";

export type ScreenStyleResolutionMode = "pass-through" | "deferred" | "live";

export type ResolvedInterpolatedStyleOutput = {
	stylesMap: NormalizedTransitionInterpolatedStyle;
	resolutionMode: ScreenStyleResolutionMode;
	wasLegacy: boolean;
};

const EMPTY_STYLES = {} as NormalizedTransitionInterpolatedStyle;

export const PASS_THROUGH_STYLE_OUTPUT: ResolvedInterpolatedStyleOutput = {
	stylesMap: EMPTY_STYLES,
	resolutionMode: "pass-through",
	wasLegacy: false,
};

export const resolveInterpolatedStyleOutput = (
	raw: Record<string, any> | null | undefined,
): ResolvedInterpolatedStyleOutput => {
	"worklet";

	// If raw is null, the user is intentionally asking to defer.
	if (raw === null) {
		return {
			stylesMap: EMPTY_STYLES,
			resolutionMode: "deferred",
			wasLegacy: false,
		};
	}

	const { result, wasLegacy } = normalizeInterpolatedStyle(raw ?? EMPTY_STYLES);

	return {
		stylesMap: result,
		resolutionMode: "live",
		wasLegacy,
	};
};
