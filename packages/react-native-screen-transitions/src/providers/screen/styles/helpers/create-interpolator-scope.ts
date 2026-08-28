import type { ScreenInterpolationProps } from "../../../../types/animation.types";
import { createBoundsAccessor } from "../../../../utils/bounds";
import type { ScreenInterpolatorFrame } from "../../animation/helpers/pipeline";
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
