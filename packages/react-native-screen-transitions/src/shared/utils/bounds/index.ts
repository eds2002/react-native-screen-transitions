import { BoundStore, type ResolvedTransitionPair } from "../../stores/bounds";
import type { ScreenInterpolationProps } from "../../types/animation.types";
import type { BoundsAccessor } from "../../types/bounds.types";
import { buildBoundsOptions } from "./helpers/build-bounds-options";
import { computeBoundStyles } from "./helpers/compute-bounds-styles";
import { createInterpolators } from "./helpers/interpolators";
import { createLinkAccessor } from "./helpers/link-accessor";
import { createNavigationAccessor } from "./helpers/navigation-accessor";
import { resolveBoundTag } from "./helpers/resolve-bound-tag";
import type { BoundsOptions } from "./types/options";

export const createBoundsAccessor = (
	getProps: () => Omit<ScreenInterpolationProps, "bounds">,
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

		const resolved = buildBoundsOptions({
			props,
			id: params?.id,
			group: params?.group,
			overrides: params,
			mode: "style",
			resolveBoundTag,
		});

		const computed = computeForResolvedOptions(resolved, props) as Record<
			string,
			unknown
		>;
		const zoomBaseOptions = {
			anchor: params?.anchor,
			scaleMode: params?.scaleMode,
			target: params?.target,
		};
		let cachedNavigationPairProps:
			| Omit<ScreenInterpolationProps, "bounds">
			| undefined;
		let cachedNavigationPairTag = "";
		let cachedNavigationPair: ResolvedTransitionPair | undefined;

		const resolveNavigationPair = (
			tag: string,
			frameProps: Omit<ScreenInterpolationProps, "bounds">,
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

		const navigation = createNavigationAccessor({
			id: params?.id,
			group: params?.group,
			getProps,
			resolveBoundTag,
			zoomBaseOptions,
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
						resolvedNavigationOptions.id,
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

		return target as typeof computed & { navigation: typeof navigation };
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
