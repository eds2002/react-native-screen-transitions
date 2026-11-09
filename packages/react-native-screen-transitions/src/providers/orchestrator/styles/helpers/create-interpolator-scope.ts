import type {
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
	TransitionInterpolatedStyle,
} from "../../../../types/animation.types";
import { createBoundsAccessor } from "../../../../utils/bounds";
import { logger } from "../../../../utils/logger";
import type { ScreenInterpolatorFrame } from "../../helpers/pipeline";
import type { SelectedInterpolatorFrame } from "./select-interpolator-frame";

export const createInterpolatorScope = ({
	frame,
	selectedFrame,
}: {
	frame: ScreenInterpolatorFrame;
	selectedFrame: SelectedInterpolatorFrame;
}): ScreenInterpolationProps => {
	"worklet";

	const selectedProps = {
		...frame,
		...selectedFrame,
	};
	return {
		...selectedProps,
		bounds: createBoundsAccessor(() => {
			"worklet";
			return selectedProps;
		}),
	};
};

/**
 * Calls a screen style interpolator for a frame: the style map it returned (undefined when it
 * returned none), or false when it threw (most often because it is not a worklet). A throw is
 * caught here, for every caller: on the UI thread it would abort a release app.
 */
export const callInterpolator = (
	interpolator: ScreenStyleInterpolator,
	frame: ScreenInterpolatorFrame,
	selectedFrame: SelectedInterpolatorFrame,
): TransitionInterpolatedStyle | undefined | false => {
	"worklet";
	try {
		const raw = interpolator(createInterpolatorScope({ frame, selectedFrame }));
		return typeof raw === "object" && raw != null ? raw : undefined;
	} catch (_) {
		if (__DEV__) {
			logger.warn("screenStyleInterpolator must be a worklet");
		}
		return false;
	}
};
