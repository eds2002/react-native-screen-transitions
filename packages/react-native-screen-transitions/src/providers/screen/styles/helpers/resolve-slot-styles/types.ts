import type { NormalizedTransitionInterpolatedStyle } from "../../../../../types/animation.types";

export type LocalStyleLayers = NormalizedTransitionInterpolatedStyle[];

export type ResettableStyleState = {
	styleKeys?: Record<string, true>;
	styleResetValues?: Record<string, unknown>;
	propKeys?: Record<string, true>;
	propResetValues?: Record<string, unknown>;
};

export type ResettableStyleStatesBySlot = Record<string, ResettableStyleState>;
