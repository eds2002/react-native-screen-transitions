import type {
	BoundsAccessor,
	BoundsInterpolationProps,
	BoundsNavigationZoomOptions,
} from "../../types/bounds.types";
import { buildContainerRevealStyles } from "./container-reveal/build";
import { createBoundTag } from "./helpers/create-bound-tag";
import { createInterpolators } from "./helpers/create-interpolators";
import { createLinkAccessor } from "./helpers/create-link-accessor";
import { prepareBoundStyles } from "./helpers/prepare-bound-styles";
import type { BoundsOptions } from "./types/options";
import { buildZoomStyles } from "./zoom/build";

export const createBoundsAccessor = (
	getProps: () => BoundsInterpolationProps,
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
		const tag = createBoundTag({
			id: options.id,
			group: options.group,
		});

		const target = Object.isExtensible(computed) ? computed : { ...computed };

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
				containerReveal: () => {
					"worklet";
					return buildContainerRevealStyles({
						props,
						tag,
					});
				},
			},
			enumerable: false,
			configurable: true,
		});

		return target;
	};

	const { getMeasured, getSnapshot, getLink } = createLinkAccessor(getProps);
	const { interpolateStyle, interpolateBounds } = createInterpolators({
		getProps,
		getLink,
	});

	return Object.assign(computeBounds, {
		getMeasured,
		getSnapshot,
		getLink,
		interpolateStyle,
		interpolateBounds,
	}) as BoundsAccessor;
};
