import type { ScreenInterpolatorFrame } from "../../../providers/screen/orchestrator/helpers/pipeline";
import { createInterpolatorScope } from "../../../providers/screen/orchestrator/styles/helpers/create-interpolator-scope";
import { normalizeSlots } from "../../../providers/screen/orchestrator/styles/helpers/normalize-slots";
import { selectInterpolatorFrame } from "../../../providers/screen/orchestrator/styles/helpers/select-interpolator-frame";
import type {
	NormalizedTransitionSlotStyle,
	ScreenStyleInterpolator,
} from "../../../types/animation.types";
import { logger } from "../../../utils/logger";

export const runOverlaySlotInterpolator = ({
	frame,
	interpolator,
}: {
	frame: ScreenInterpolatorFrame;
	interpolator: ScreenStyleInterpolator | undefined;
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
