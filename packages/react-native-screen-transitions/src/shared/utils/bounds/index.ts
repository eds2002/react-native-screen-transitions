import type {
	BoundsAccessor,
	BoundsInterpolationProps,
	BoundsNavigationZoomOptions,
} from "../../types/bounds.types";
import { createBoundsAccessorCore } from "./helpers/create-bounds-accessor-core";
import { buildRevealStyles } from "./navigation/reveal/build";
import { buildZoomStyles } from "./navigation/zoom/build";

export const createBoundsAccessor = (
	getProps: () => BoundsInterpolationProps,
): BoundsAccessor => {
	"worklet";

	return createBoundsAccessorCore({
		getProps,
		extendResult: ({ target, props, tag }) => {
			"worklet";
			Object.defineProperty(target, "navigation", {
				value: {
					zoom: (zoomOptions?: BoundsNavigationZoomOptions) => {
						"worklet";
						return buildZoomStyles({
							props,
							tag,
							zoomOptions,
						});
					},
					reveal: () => {
						"worklet";
						return buildRevealStyles({
							props,
							tag,
						});
					},
				},
				enumerable: false,
				configurable: true,
			});
		},
	}) as BoundsAccessor;
};
