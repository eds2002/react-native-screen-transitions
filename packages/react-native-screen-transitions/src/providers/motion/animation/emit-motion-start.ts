import { FALSE, TRUE } from "../../../constants";
import { emit } from "../../../utils/animation/emit";
import type { MotionAnimationValues } from "../types";

export const emitMotionStart = (animations: MotionAnimationValues) => {
	"worklet";

	animations.progressSettled.set(FALSE);

	if (animations.progressAnimating.get()) {
		return false;
	}

	const { progressRequest, progressSettled } = animations;
	const id = progressRequest.get().id;

	emit(animations.willAnimate, TRUE, FALSE);
	requestAnimationFrame(() => {
		"worklet";
		if (progressRequest.get().id === id && !progressSettled.get()) {
			animations.progressAnimating.set(TRUE);
		}
	});
	return true;
};
