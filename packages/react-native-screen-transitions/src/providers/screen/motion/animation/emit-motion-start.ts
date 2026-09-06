import { FALSE, TRUE } from "../../../../constants";
import { emit } from "../../../../utils/animation/emit";
import type { MotionAnimationValues } from "../types";

export const emitMotionStart = (animations: MotionAnimationValues) => {
	"worklet";

	animations.progressSettled.set(FALSE);

	if (animations.progressAnimating.get()) {
		return false;
	}

	emit(animations.willAnimate, TRUE, FALSE);
	requestAnimationFrame(() => {
		"worklet";
		animations.progressAnimating.set(TRUE);
	});
	return true;
};
