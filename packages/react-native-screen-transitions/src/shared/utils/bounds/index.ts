import { BoundStore, type ResolvedTransitionPair } from "../../stores/bounds";
import type { ScreenInterpolationProps } from "../../types/animation.types";
import type {
	BoundsAccessor,
	BoundsInterpolationProps,
} from "../../types/bounds.types";
import { buildBoundsOptions } from "./helpers/build-bounds-options";
import { computeBoundStyles } from "./helpers/compute-bounds-styles";
import { createInterpolators } from "./helpers/interpolators";
import { createLinkAccessor } from "./helpers/link-accessor";
import { resolveBoundTag } from "./helpers/resolve-bound-tag";
import type { BoundsOptions } from "./types/options";
import { createZoomAccessor } from "./zoom";

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
		syncGroupActiveMember(params?.group, params?.id);

		const resolved = buildBoundsOptions({
			props,
			id: params?.id,
			group: params?.group,
			overrides: params,
			mode: "style",
			resolveBoundTag,
		});

		const computed = computeForResolvedOptions(resolved, props);

		let cachedNavigationPairProps: BoundsInterpolationProps | undefined;
		let cachedNavigationPairTag = "";
		let cachedNavigationPair: ResolvedTransitionPair | undefined;

		const resolveNavigationPair = (
			tag: string,
			frameProps: BoundsInterpolationProps,
		): ResolvedTransitionPair | undefined => {
			"worklet";
			if (!tag) return undefined;

			if (
				cachedNavigationPairProps === frameProps &&
				cachedNavigationPairTag === tag
			) {
				return cachedNavigationPair;
			}

			const nextPair = BoundStore.resolveTransitionPair(tag, {
				currentScreenKey: frameProps.current?.route.key,
				previousScreenKey: frameProps.previous?.route.key,
				nextScreenKey: frameProps.next?.route.key,
				entering: !frameProps.next,
			});

			cachedNavigationPairProps = frameProps;
			cachedNavigationPairTag = tag;
			cachedNavigationPair = nextPair;

			return nextPair;
		};

		const navigation = createZoomAccessor({
			id: params?.id,
			group: params?.group,
			getProps,
			resolveBoundTag,
			computeRaw: (overrides, frameProps) =>
				(() => {
					const currentProps = frameProps ?? getProps();
					const resolvedNavigationOptions = buildBoundsOptions({
						props: currentProps,
						id: params?.id,
						group: params?.group,
						overrides,
						mode: "navigation",
						resolveBoundTag,
					});
					const resolvedPair = resolveNavigationPair(
						String(resolvedNavigationOptions.id),
						currentProps,
					);

					return computeForResolvedOptions(
						resolvedNavigationOptions,
						currentProps,
						resolvedPair,
					) as Record<string, unknown>;
				})(),
		});

		const target = Object.isExtensible(computed) ? computed : { ...computed };

		Object.defineProperty(target, "navigation", {
			value: navigation,
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
