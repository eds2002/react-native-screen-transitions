import type { MeasuredDimensions, SharedValue } from "react-native-reanimated";

export type BoundKey = string;

export interface ExtendedMeasuredDimensions extends MeasuredDimensions {
	id: BoundKey;
}

export type Bounds = SharedValue<ExtendedMeasuredDimensions>;
export type BoundsMap = Record<BoundKey, Bounds>;
export type BoundsActive = Record<BoundKey, boolean>;
