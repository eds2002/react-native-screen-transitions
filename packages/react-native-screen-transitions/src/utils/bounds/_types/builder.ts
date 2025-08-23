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

export type BoundsAnchor =
	| "topLeading"
	| "top"
	| "topTrailing"
	| "leading"
	| "center"
	| "trailing"
	| "bottomLeading"
	| "bottom"
	| "bottomTrailing";

export type BoundsScaleMode = "match" | "none" | "uniform";

export type BoundsTarget = "bound" | "fullscreen";

export type BoundsSpace = "relative" | "absolute";

export type BoundsComputeParams = BoundsBuilderInitParams;

export type BoundsBuilderOptions = {
	/**
	 * @deprecated Use `content.scaleMode` instead.
	 */
	toFullscreen?: boolean;
	/**
	 * @deprecated Use `content.anchor` instead.
	 */
	absolute?: boolean;
	/**
	 * @deprecated Use `content.anchor` instead.
	 */
	relative?: boolean;
	/**
	 * @deprecated Use `scaleMode` instead.
	 */
	contentScaleMode?: "aspectFill" | "aspectFit" | "auto";

	method?: BoundsMethod;
	space?: BoundsSpace;
	target?: BoundsTarget;
	gestures?: { x?: number; y?: number };
	scaleMode?: BoundsScaleMode;
	anchor?: BoundsAnchor;
};
