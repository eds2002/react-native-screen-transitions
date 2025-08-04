import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";

export type BoundEntry = {
	bounds: MeasuredDimensions;
	styles: StyleProps;
};

export type BoundsBuilder = {
	start: (screen?: "previous" | "current" | "next") => BoundsBuilder;
	end: (screen?: "previous" | "current" | "next") => BoundsBuilder;
	isEntering: () => BoundsBuilder;
	isExiting: () => BoundsBuilder;
	x: (value: number) => BoundsBuilder;
	y: (value: number) => BoundsBuilder;
	build: () => StyleProps;
};

export interface BoundsAccessor {
	(id?: string): BoundsBuilder;

	get: (
		phase: "previous" | "current" | "next",
		id: string,
	) => {
		bounds: MeasuredDimensions;
		styles: StyleProps;
	};
}
