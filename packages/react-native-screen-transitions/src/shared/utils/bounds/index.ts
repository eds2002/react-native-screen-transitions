import type { ScreenInterpolationProps } from "../../types/animation.types";
import type {
	BoundsAccessor,
	BoundsNavigationZoomOptions,
} from "../../types/bounds.types";
import { createBoundTag } from "./helpers/create-bound-tag";
import { createInterpolators } from "./helpers/create-interpolators";
import { createLinkAccessor } from "./helpers/create-link-accessor";
import { prepareBoundStyles } from "./helpers/prepare-bound-styles";
import type { BoundsOptions } from "./types/options";
import { buildZoomStyles } from "./zoom/build";

export const createBoundsAccessor = (
	getProps: () => Omit<ScreenInterpolationProps, "bounds">,
): BoundsAccessor => {
	"worklet";

	const computeBounds = (params?: BoundsOptions) => {
		"worklet";
		const props = getProps();
		const options = (params ?? { id: "" }) as BoundsOptions;
		const computed = prepareBoundStyles({
			props,
			options,
		});
		// Navigation helpers are intentionally opinionated. Only the resolved
		// tag from `id`/`group` is allowed to flow into `navigation.zoom()`;
		// base bounds overrides like `target`, `anchor`, or `scaleMode` must not.
		const navigationTag = createBoundTag({
			id: options.id,
			group: options.group,
		});

		const target = Object.isExtensible(computed) ? computed : { ...computed };

		Object.defineProperty(target, "navigation", {
			value: {
				zoom: (options?: BoundsNavigationZoomOptions) => {
					"worklet";
					return buildZoomStyles({
						props: getProps(),
						resolvedTag: navigationTag,
						zoomOptions: options,
					});
				},
			},
			enumerable: false,
			configurable: true,
		});

		return target;
	};

	const { getMeasured, getLink } = createLinkAccessor(getProps);
	const { interpolateStyle, interpolateBounds } = createInterpolators({
		getProps,
		getLink,
	});

	return Object.assign(computeBounds, {
		getMeasured,
		getLink,
		interpolateStyle,
		interpolateBounds,
	}) as BoundsAccessor;
};
