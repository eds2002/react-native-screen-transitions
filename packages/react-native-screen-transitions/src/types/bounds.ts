import type { StyleProps } from "react-native-reanimated";

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
