import type {
	ScreenInterpolationProps,
	ScreenTransitionAccessor,
} from "../../../../types/animation.types";
import { createBoundsAccessor } from "../../../../utils/bounds";
import type { ScreenInterpolatorFrame } from "../../animation/helpers/pipeline";
import type { SelectedInterpolatorFrame } from "./select-interpolator-frame";

export const createInterpolatorScope = ({
	frame,
	selectedFrame,
	transition,
}: {
	frame: ScreenInterpolatorFrame;
	selectedFrame: SelectedInterpolatorFrame;
	transition: ScreenTransitionAccessor;
}): ScreenInterpolationProps => {
	"worklet";

	const selectedProps = {
		...frame,
		...selectedFrame,
	};
	let scope: ScreenInterpolationProps;
	const scopedTransition: ScreenTransitionAccessor = (target) => {
		"worklet";

		if ((target?.depth ?? 0) === 0) {
			return scope;
		}

		return transition(target);
	};

	scope = {
		...selectedProps,
		bounds: createBoundsAccessor(() => {
			"worklet";
			return selectedProps;
		}),
		transition: scopedTransition,
	};

	return scope;
};
