import type { BoundsInterpolationProps } from "../../../types/bounds.types";
import {
	type BoundsAccessorCore,
	createBoundsAccessorCore,
} from "../helpers/create-bounds-accessor-core";

export type { BoundsComputeResult as NavigationBoundsResult } from "../helpers/create-bounds-accessor-core";

export type NavigationBoundsAccessor = BoundsAccessorCore;

export const createNavigationBoundsAccessor = (
	getProps: () => BoundsInterpolationProps,
): NavigationBoundsAccessor => {
	"worklet";

	return createBoundsAccessorCore({ getProps });
};
