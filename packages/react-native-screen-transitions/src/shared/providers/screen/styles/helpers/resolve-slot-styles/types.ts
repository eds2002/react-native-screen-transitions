import type { NormalizedTransitionInterpolatedStyle } from "../../../../../types/animation.types";

export type LocalStyleLayers = NormalizedTransitionInterpolatedStyle[];

export type ResettableStyleState = {
	styleKeys?: Record<string, true>;
	styleResetValues?: Record<string, unknown>;
	propKeys?: Record<string, true>;
	propResetValues?: Record<string, unknown>;
	/** The previous resolved slot owned a clip presentation. */
	hadClip?: true;
};

export type ResettableStyleStatesBySlot = Record<string, ResettableStyleState>;
