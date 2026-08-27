import type { ScreenInterpolatorFrame } from "../../../providers/screen/animation/helpers/pipeline";
import { createInterpolatorScope } from "../../../providers/screen/styles/helpers/create-interpolator-scope";
import { normalizeSlots } from "../../../providers/screen/styles/helpers/normalize-slots";
import { selectInterpolatorFrame } from "../../../providers/screen/styles/helpers/select-interpolator-frame";
import type {
	NormalizedTransitionSlotStyle,
	ScreenStyleInterpolator,
	ScreenTransitionAccessor,
} from "../../../types/animation.types";
import { logger } from "../../../utils/logger";

export const runOverlaySlotInterpolator = ({
	frame,
	interpolator,
	transition,
}: {
	frame: ScreenInterpolatorFrame;
	interpolator: ScreenStyleInterpolator | undefined;
	transition: ScreenTransitionAccessor;
}): NormalizedTransitionSlotStyle | undefined => {
	"worklet";

	if (!interpolator) {
		return undefined;
	}

	try {
		const raw = interpolator(
			createInterpolatorScope({
				frame,
				selectedFrame: selectInterpolatorFrame(frame, false),
				transition,
			}),
		);

		if (!raw?.overlay) {
			return undefined;
		}

		return normalizeSlots({ overlay: raw.overlay }).overlay;
	} catch (_) {
		if (__DEV__) {
			logger.warn("screenStyleInterpolator must be a worklet");
		}

		return undefined;
	}
};
