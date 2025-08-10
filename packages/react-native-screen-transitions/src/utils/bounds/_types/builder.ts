import type { ScaledSize } from "react-native";
import type { ScreenTransitionState } from "../../../types/animation";
import type { BoundsMethod } from "../../../types/bounds";

/**
 * Params passed to the builder initializer. No method required here.
 */
export type BoundsBuilderInitParams = {
	id: string | null;
	previous?: ScreenTransitionState;
	current: ScreenTransitionState;
	next?: ScreenTransitionState;
	progress: number;
	dimensions: ScaledSize;
};

/**
 * Params used internally for final computation. Method is required.
 */
export type BoundsComputeParams = BoundsBuilderInitParams & {
	method: BoundsMethod;
};

/**
 * Builder options that affect how math is applied.
 * Method is not an option; it's tracked separately by the builder.
 */
export type BoundsBuilderOptions = {
	gestures?: { x?: number; y?: number };
	toFullscreen?: boolean;
	absolute?: boolean;
	relative?: boolean;
	method?: BoundsMethod;
	contentScaleMode?: "aspectFill" | "aspectFit" | "auto";
};
