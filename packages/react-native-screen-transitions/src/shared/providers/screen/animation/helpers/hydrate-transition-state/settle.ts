import {
	FALSE,
	LOGICAL_SETTLE_PROGRESS_THRESHOLD,
	LOGICAL_SETTLE_REQUIRED_FRAMES,
	TRUE,
} from "../../../../../constants";
import type { ComputeLogicallySettledParams } from "./types";

export const computeSettled = (
	animating: number,
	dismissing: number,
	closing: number,
) => {
	"worklet";
	return animating || dismissing || closing ? FALSE : TRUE;
};

export const computeLogicallySettled = (
	params: ComputeLogicallySettledParams,
) => {
	"worklet";
	return Math.abs(params.progress - params.targetProgress) <=
		LOGICAL_SETTLE_PROGRESS_THRESHOLD &&
		params.frameCount >= LOGICAL_SETTLE_REQUIRED_FRAMES
		? TRUE
		: FALSE;
};

export const computeNextLogicalSettleFrameCount = (
	params: ComputeLogicallySettledParams,
) => {
	"worklet";
	if (
		Math.abs(params.progress - params.targetProgress) >
		LOGICAL_SETTLE_PROGRESS_THRESHOLD
	) {
		return 0;
	}

	return Math.min(params.frameCount + 1, LOGICAL_SETTLE_REQUIRED_FRAMES);
};
