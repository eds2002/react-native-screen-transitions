import type {
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
	TransitionInterpolatedStyle,
} from "../../../../types/animation.types";
import { createBoundsAccessor } from "../../../../utils/bounds";
import { withDefaultBoundarySlots } from "../../../../utils/bounds/helpers/default-boundary-slots";
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
const callWithScope = (
	interpolator: ScreenStyleInterpolator,
	scope: ScreenInterpolationProps,
): TransitionInterpolatedStyle | undefined | false => {
	"worklet";
	try {
		const raw = interpolator(scope);
		return typeof raw === "object" && raw != null ? raw : undefined;
	} catch (error) {
		if (__DEV__) {
			logger.warn(
				`screenStyleInterpolator threw (is it a worklet?): ${String(error)}`,
			);
		}
		return false;
	}
};

export const callInterpolator = (
	interpolator: ScreenStyleInterpolator,
	frame: ScreenInterpolatorFrame,
	selectedFrame: SelectedInterpolatorFrame,
): TransitionInterpolatedStyle | undefined | false => {
	"worklet";
	return callWithScope(
		interpolator,
		createInterpolatorScope({ frame, selectedFrame }),
	);
};

/**
 * A screen's styles for a frame: its interpolator's (if it has one), with matching boundaries the
 * interpolator left alone flying on their own (see withDefaultBoundarySlots). False when the
 * interpolator threw.
 */
export const callScreenInterpolator = (
	interpolator: ScreenStyleInterpolator | undefined,
	frame: ScreenInterpolatorFrame,
	selectedFrame: SelectedInterpolatorFrame,
): TransitionInterpolatedStyle | undefined | false => {
	"worklet";
	const scope = createInterpolatorScope({ frame, selectedFrame });
	const raw = interpolator ? callWithScope(interpolator, scope) : undefined;
	if (raw === false) return false;
	return withDefaultBoundarySlots(raw, scope);
};
