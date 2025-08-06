import type { ScaledSize } from "react-native";
import type { ScreenTransitionState } from "../../../../types/animation";

export type BoundsBuilderComputeParams = {
	id: string | null;
	previous?: ScreenTransitionState;
	current: ScreenTransitionState;
	next?: ScreenTransitionState;
	progress: number;
	dimensions: ScaledSize;
	method: "transform" | "size" | "content";
};

export type BoundsBuilderOptions = {
	withGestures?: { x?: number; y?: number };
	toFullscreen?: boolean;
	absolute?: boolean;
	relative?: boolean;
	scaleMode?: "axis" | "aspectFill" | "aspectFit";
};
