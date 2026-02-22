import type { ScreenInterpolationProps } from "../../types/animation.types";
import type { BoundsAccessor } from "../../types/bounds.types";
import { buildBoundsOptions } from "./helpers/build-bounds-options";
import { computeBoundStyles } from "./helpers/compute-bounds-styles";
import { createInterpolators } from "./helpers/interpolators";
import { createLinkAccessor } from "./helpers/link-accessor";
import { createNavigationAccessor } from "./helpers/navigation-accessor";
import { resolveBoundTag } from "./helpers/resolve-bound-tag";
import type { BoundsOptions } from "./types/options";

export const createBounds = (
	props: Omit<ScreenInterpolationProps, "bounds">,
): BoundsAccessor => {
	"worklet";

	const computeForResolvedOptions = (resolvedOptions: BoundsOptions) => {
		"worklet";
		return computeBoundStyles(
			{
				id: resolvedOptions.id,
				previous: props.previous,
				current: props.current,
				next: props.next,
				progress: props.progress,
				dimensions: props.layouts.screen,
			},
			resolvedOptions,
		);
	};

	const computeElementBoundsStyles = (params?: BoundsOptions) => {
		"worklet";

		const resolved = buildBoundsOptions({
			props,
			id: params?.id,
			group: params?.group,
			overrides: params,
			mode: "style",
			resolveBoundTag,
		});

		const computed = computeForResolvedOptions(resolved) as Record<
			string,
			unknown
		>;
		const zoomBaseOptions = {
			anchor: params?.anchor,
			scaleMode: params?.scaleMode,
			target: params?.target,
		};
		const navigation = createNavigationAccessor({
			id: params?.id,
			group: params?.group,
			props,
			resolveBoundTag,
			zoomBaseOptions,
			computeRaw: (overrides) =>
				computeForResolvedOptions(
					buildBoundsOptions({
						props,
						id: params?.id,
						group: params?.group,
						overrides,
						mode: "navigation",
						resolveBoundTag,
					}),
				) as Record<string, unknown>,
		});

		const target = Object.isExtensible(computed) ? computed : { ...computed };

		Object.defineProperty(target, "navigation", {
			value: navigation,
			enumerable: false,
			configurable: true,
		});

		return target as typeof computed & { navigation: typeof navigation };
	};

	const { getSnapshot, getLink } = createLinkAccessor(props);
	const { interpolateStyle, interpolateBounds } = createInterpolators({
		props,
		getLink,
	});

	return Object.assign(computeElementBoundsStyles, {
		getSnapshot,
		getLink,
		interpolateStyle,
		interpolateBounds,
	}) as BoundsAccessor;
};
