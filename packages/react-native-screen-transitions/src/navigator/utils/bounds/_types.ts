import type { ScaledSize } from "react-native";
import type { ScreenTransitionState } from "../../../types/animation";

export type Geometry = {
	dx: number;
	dy: number;
	scaleX: number;
	scaleY: number;
	gestureX: number;
	gestureY: number;
	ranges: readonly [number, number];
	entering: boolean;
};

export type BoundsStyleComputeParams = {
	id: string | null;
	previous?: ScreenTransitionState;
	current: ScreenTransitionState;
	next?: ScreenTransitionState;
	progress: number;
	dimensions: ScaledSize;
	method: "transform" | "size";
};

export type BoundStyleOptions = {
	withGestures?: boolean;
	toFullscreen?: boolean;
	absolute?: boolean;
	relative?: boolean;
};
