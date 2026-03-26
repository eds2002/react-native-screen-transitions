import { NO_STYLES } from "../../../../constants";
import type {
	DeferredScreenStyleSignal,
	NormalizedTransitionInterpolatedStyle,
} from "../../../../types/animation.types";
import { normalizeInterpolatedStyle } from "../../../../utils/normalize-interpolated-style";

export type ScreenStyleResolutionMode = "pass-through" | "deferred" | "live";

export type ResolvedInterpolatedStyleOutput = {
	stylesMap: NormalizedTransitionInterpolatedStyle;
	resolutionMode: ScreenStyleResolutionMode;
	wasLegacy: boolean;
};

export const PASS_THROUGH_STYLE_OUTPUT: ResolvedInterpolatedStyleOutput = {
	stylesMap: NO_STYLES,
	resolutionMode: "pass-through",
	wasLegacy: false,
};

export const resolveEffectiveResolutionMode = ({
	resolutionMode,
	isSettled,
}: {
	resolutionMode: ScreenStyleResolutionMode;
	isSettled: boolean;
}): ScreenStyleResolutionMode => {
	"worklet";
	if (resolutionMode === "deferred" && isSettled) {
		return "pass-through";
	}
	return resolutionMode;
};

export const resolveInterpolatedStyleOutput = (
	raw: Record<string, any> | DeferredScreenStyleSignal | null | undefined,
): ResolvedInterpolatedStyleOutput => {
	"worklet";

	if (raw === "defer") {
		return {
			stylesMap: NO_STYLES,
			resolutionMode: "deferred",
			wasLegacy: false,
		};
	}

	if (raw == null) {
		return PASS_THROUGH_STYLE_OUTPUT;
	}

	const { result, wasLegacy } = normalizeInterpolatedStyle(raw ?? NO_STYLES);

	return {
		stylesMap: result,
		resolutionMode: "live",
		wasLegacy,
	};
};
