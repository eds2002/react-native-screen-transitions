import type {
	ScreenInterpolationProps,
	ScreenTransitionValue,
} from "../../../../types/animation.types";
import type { ScreenTransitionSource } from "../../../../types/bounds.types";

export const createTransitionValue = (
	source: ScreenTransitionSource,
): ScreenTransitionValue => {
	"worklet";

	return {
		source,
		get: () => {
			"worklet";
			const frame = source.screenInterpolatorProps.get();
			return {
				...frame,
				bounds: source.boundsAccessor,
			} as ScreenInterpolationProps;
		},
	} as ScreenTransitionValue;
};
