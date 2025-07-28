import type {
	MeasuredDimensions,
	SharedValue,
	StyleProps,
} from "react-native-reanimated";

export type BoundKey = string;

export interface ExtendedMeasuredDimensions extends MeasuredDimensions {
	id: BoundKey;
}

export type Bounds = SharedValue<ExtendedMeasuredDimensions>;
export type BoundsMap = Record<BoundKey, Bounds>;
export type BoundsActive = Record<BoundKey, boolean>;

export type BoundsBuilder = {
	start: (screen: "previous" | "current" | "next") => BoundsBuilder;
	end: (screen: "previous" | "current" | "next") => BoundsBuilder;
	isEntering: () => BoundsBuilder;
	isExiting: () => BoundsBuilder;
	x: (value: number) => BoundsBuilder;
	y: (value: number) => BoundsBuilder;
	opacity: ([start, end]: [number, number]) => BoundsBuilder;
	build: () => StyleProps;
};
