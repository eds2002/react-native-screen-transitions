import type { ScreenTransitionState } from "../../../types/animation";
import type { ScreenPhase } from "../../../types/core";

export type GetBoundsParams = {
	id: string | null;
	phase?: ScreenPhase;
	previous?: ScreenTransitionState;
	current: ScreenTransitionState;
	next?: ScreenTransitionState;
};
