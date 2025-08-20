import type { ScreenPhase } from '../../../types/core';
import type { ScreenTransitionState } from '../../../types/animation';

export type GetBoundsParams = {
  id: string | null;
  phase?: ScreenPhase;
  previous?: ScreenTransitionState;
  current: ScreenTransitionState;
  next?: ScreenTransitionState;
};
