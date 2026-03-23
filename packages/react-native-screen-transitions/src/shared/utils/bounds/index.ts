import { BoundStore, type ResolvedTransitionPair } from "../../stores/bounds";
import type { ScreenInterpolationProps } from "../../types/animation.types";
import type {
	BoundsAccessor,
	BoundsInterpolationProps,
	BoundsNavigationZoomOptions,
} from "../../types/bounds.types";
import { buildBoundsOptions } from "./helpers/build-bounds-options";
import { computeBoundStyles } from "./helpers/compute-bounds-styles";
import { createInterpolators } from "./helpers/interpolators";
import { createLinkAccessor } from "./helpers/link-accessor";
import { resolveBoundTag } from "./helpers/resolve-bound-tag";
import type { BoundsOptions } from "./types/options";
import { buildZoomStyles } from "./zoom/build";

const syncGroupActiveMember = (group?: string, id?: string | number) => {
	"worklet";
	if (!group) return;
	if (id === undefined || id === null || id === "") return;

	const normalizedId = String(id);
	if (BoundStore.getGroupActiveId(group) === normalizedId) return;

	BoundStore.setGroupActiveId(group, normalizedId);
};

export const createBoundsAccessor = (
	getProps: () => BoundsInterpolationProps,
): BoundsAccessor => {
	"worklet";

	const computeForResolvedOptions = (
		resolvedOptions: BoundsOptions,
		props: Omit<ScreenInterpolationProps, "bounds">,
		resolvedPair?: ResolvedTransitionPair,
	) => {
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
			resolvedPair,
		);
	};

	const computeElementBoundsStyles = (params?: BoundsOptions) => {
		"worklet";
		const props = getProps();
		const id = params?.id;
		const group = params?.group;
		syncGroupActiveMember(group, id);

		const resolved = buildBoundsOptions({
			props,
			id,
			group,
			overrides: params,
			mode: "style",
			resolveBoundTag,
		});

		const computed = computeForResolvedOptions(resolved, props);
		// Navigation helpers are intentionally opinionated. Only the resolved
		// tag from `id`/`group` is allowed to flow into `navigation.zoom()`;
		// base bounds overrides like `target`, `anchor`, or `scaleMode` must not.
		const navigationTag = resolveBoundTag({ id, group });

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

	const { getSnapshot, getLink } = createLinkAccessor(getProps);
	const { interpolateStyle, interpolateBounds } = createInterpolators({
		getProps,
		getLink,
	});

	return Object.assign(computeElementBoundsStyles, {
		getSnapshot,
		getLink,
		interpolateStyle,
		interpolateBounds,
	}) as BoundsAccessor;
};
