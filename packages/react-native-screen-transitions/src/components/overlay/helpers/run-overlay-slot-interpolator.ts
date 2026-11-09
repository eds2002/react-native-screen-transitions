import type { ScreenInterpolatorFrame } from "../../../providers/orchestrator/helpers/pipeline";
import { callInterpolator } from "../../../providers/orchestrator/styles/helpers/create-interpolator-scope";
import { normalizeSlots } from "../../../providers/orchestrator/styles/helpers/normalize-slots";
import { selectInterpolatorFrame } from "../../../providers/orchestrator/styles/helpers/select-interpolator-frame";
import type {
	NormalizedTransitionSlotStyle,
	ScreenStyleInterpolator,
} from "../../../types/animation.types";

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

	const raw = callInterpolator(
		interpolator,
		frame,
		selectInterpolatorFrame(frame, false),
	);
	if (!raw) {
		return undefined;
	}
	return raw.overlay
		? normalizeSlots({ overlay: raw.overlay }).overlay
		: undefined;
};
