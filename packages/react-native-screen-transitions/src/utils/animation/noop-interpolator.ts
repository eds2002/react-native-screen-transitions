import type { TransitionInterpolatedStyle } from "@/types";

export const noopinterpolator = (): TransitionInterpolatedStyle => {
	"worklet";
	return {
		contentStyle: {},
		overlayStyle: {},
	};
};
