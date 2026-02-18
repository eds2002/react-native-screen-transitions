import type { MeasuredDimensions } from "react-native-reanimated";
import {
	EMPTY_BOUND_HELPER_RESULT,
	EMPTY_BOUND_HELPER_RESULT_RAW,
	ENTER_RANGE,
	EXIT_RANGE,
	FULLSCREEN_DIMENSIONS,
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_HOST_FLAG_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
} from "../../constants";
import { BoundStore, type Snapshot } from "../../stores/bounds.store";
import type {
	ScreenInterpolationProps,
	ScreenTransitionState,
	TransitionInterpolatedStyle,
} from "../../types/animation.types";
import type {
	BoundsAccessor,
	BoundsLink,
	BoundsMatchStyleOptions,
	BoundsNavigationOptions,
	BoundsNavigationPreset,
} from "../../types/bounds.types";
import type { Layout } from "../../types/screen.types";
import {
	computeContentTransformGeometry,
	computeRelativeGeometry,
} from "./helpers/geometry";
import { interpolateClamped } from "./helpers/interpolate";
import { interpolateLinkStyle } from "./helpers/interpolate-style";
import {
	composeContentStyle,
	composeSizeAbsolute,
	composeSizeRelative,
	composeTransformAbsolute,
	composeTransformRelative,
	type ElementComposeParams,
} from "./helpers/style-composers";
import type { BoundsComputeParams, BoundsOptions } from "./types/options";

const DEFAULT_BOUNDS_OPTIONS = {
	target: "bound",
	method: "transform",
	space: "relative",
	scaleMode: "match",
	anchor: "center",
	raw: false,
} as const satisfies Omit<BoundsOptions, "id" | "group" | "gestures">;

const NO_NAVIGATION_STYLE = Object.freeze({}) as TransitionInterpolatedStyle;

const toNumber = (value: unknown, fallback = 0): number => {
	"worklet";
	return typeof value === "number" ? value : fallback;
};

const resolveBounds = (props: {
	id: string;
	previous?: ScreenTransitionState;
	current?: ScreenTransitionState;
	next?: ScreenTransitionState;
	toRect?: Partial<MeasuredDimensions>;
	dimensions: Layout;
	computeOptions: BoundsOptions;
}) => {
	"worklet";
	const entering = !props.next;
	const fullscreen = FULLSCREEN_DIMENSIONS(props.dimensions);

	const isFullscreenTarget = props.computeOptions.target === "fullscreen";
	const hasCustomTarget = typeof props.computeOptions.target === "object";
	const hasTargetOverride = isFullscreenTarget || hasCustomTarget;

	// Try exact match first (strict matching for nested stacks)
	let link = BoundStore.getActiveLink(props.id, props.current?.route.key);

	// For target overrides, fall back to most recent link for this tag
	// (destination screen might not have a matching element)
	if (!link && hasTargetOverride) {
		link = BoundStore.getActiveLink(props.id); // No screenKey = get most recent
	}

	if (!link || !link.source) {
		return {
			start: null,
			end: null,
			entering,
		};
	}

	// When target is overridden, destination element is not required
	if (!hasTargetOverride && !link.destination) {
		return {
			start: null,
			end: null,
			entering,
		};
	}

	const { destination, source } = link;

	const start = source.bounds;
	let end = destination?.bounds ?? fullscreen;

	if (isFullscreenTarget) {
		end = fullscreen;
	}

	const customTarget = props.computeOptions.target;

	if (typeof customTarget === "object") {
		end = customTarget;
	}

	return {
		start,
		end,
		entering,
	};
};

const computeBoundStyles = (
	{ id, previous, current, next, progress, dimensions }: BoundsComputeParams,
	computeOptions: BoundsOptions = { id: "bound-id" },
) => {
	"worklet";
	if (!id) {
		if (computeOptions.raw) {
			return EMPTY_BOUND_HELPER_RESULT_RAW;
		}
		return EMPTY_BOUND_HELPER_RESULT;
	}

	const { start, end, entering } = resolveBounds({
		id,
		previous,
		current,
		next,
		computeOptions,
		dimensions,
	});

	if (!start || !end) {
		if (computeOptions.raw) {
			return EMPTY_BOUND_HELPER_RESULT_RAW;
		}
		return EMPTY_BOUND_HELPER_RESULT;
	}

	const ranges: readonly [number, number] = entering ? ENTER_RANGE : EXIT_RANGE;

	if (computeOptions.method === "content") {
		const geometry = computeContentTransformGeometry({
			start,
			end,
			entering,
			dimensions,
			anchor: computeOptions.anchor,
			scaleMode: computeOptions.scaleMode,
		});

		return composeContentStyle({
			start,
			progress,
			ranges,
			end,
			geometry,
			computeOptions,
		});
	}

	const geometry = computeRelativeGeometry({
		start,
		end,
		entering,
		anchor: computeOptions.anchor,
		scaleMode: computeOptions.scaleMode,
	});

	const common: ElementComposeParams = {
		start,
		end,
		progress,
		ranges,
		geometry,
		computeOptions,
	};

	const isSize = computeOptions.method === "size";
	const isAbs = computeOptions.space === "absolute";

	return isSize
		? isAbs
			? composeSizeAbsolute(common)
			: composeSizeRelative(common)
		: isAbs
			? composeTransformAbsolute(common)
			: composeTransformRelative(common);
};

export const createBounds = (
	props: Omit<ScreenInterpolationProps, "bounds">,
): BoundsAccessor => {
	"worklet";
	const resolveTag = ({
		id,
		group,
	}: {
		id?: string;
		group?: string;
	}): string | undefined => {
		"worklet";

		if (!id) return id;

		if (!group) {
			return id;
		}

		const currentActiveId = BoundStore.getGroupActiveId(group);
		if (currentActiveId !== id) {
			BoundStore.setGroupActiveId(group, id);
		}

		return `${group}:${id}`;
	};

	const resolveComputeOptions = ({
		id,
		group,
		overrides,
	}: {
		id?: string;
		group?: string;
		overrides?: Partial<BoundsOptions>;
	}): BoundsOptions => {
		"worklet";
		const tag = resolveTag({ id, group });
		const currentScreenKey = props.current?.route.key;
		const boundaryConfig =
			tag && currentScreenKey
				? BoundStore.getBoundaryConfig(tag, currentScreenKey)
				: null;

		return {
			...DEFAULT_BOUNDS_OPTIONS,
			...(boundaryConfig ?? {}),
			...(overrides ?? {}),
			id: tag ?? "",
			group,
		};
	};

	const compute = (resolvedOptions: BoundsOptions) => {
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

	const buildNavigationStyles = ({
		id,
		group,
		preset,
		navigationOptions,
	}: {
		id: string;
		group?: string;
		preset: BoundsNavigationPreset;
		navigationOptions?: BoundsNavigationOptions;
	}): TransitionInterpolatedStyle => {
		"worklet";

		const isZoomPreset = preset === "zoom";
		const defaultAnchor = preset === "zoom" ? "top" : undefined;
		const defaultScaleMode = "uniform";

		const resolvedTag = resolveTag({ id, group });
		if (!resolvedTag) return NO_NAVIGATION_STYLE;

		const currentScreenKey = props.current?.route.key;
		const boundaryConfig = currentScreenKey
			? BoundStore.getBoundaryConfig(resolvedTag, currentScreenKey)
			: null;

		const sharedOptions = {
			...(navigationOptions ?? {}),
			id,
			group,
			anchor:
				navigationOptions?.anchor ?? boundaryConfig?.anchor ?? defaultAnchor,
			scaleMode:
				navigationOptions?.scaleMode ??
				boundaryConfig?.scaleMode ??
				defaultScaleMode,
		};

		const explicitTarget = navigationOptions?.target ?? boundaryConfig?.target;

		const zoomContentTarget = (() => {
			"worklet";
			if (!isZoomPreset) return null;
			if (explicitTarget !== undefined) return explicitTarget;

			const scopedLink = BoundStore.getActiveLink(
				resolvedTag,
				props.current?.route.key,
			);
			const latestLink = scopedLink ?? BoundStore.getActiveLink(resolvedTag);
			const sourceBounds = latestLink?.source?.bounds;
			const screenWidth = props.layouts.screen.width;

			if (!sourceBounds || sourceBounds.width <= 0 || screenWidth <= 0) {
				return "fullscreen";
			}

			const height = (sourceBounds.height / sourceBounds.width) * screenWidth;

			return {
				x: 0,
				y: 0,
				pageX: 0,
				pageY: 0,
				width: screenWidth,
				height,
			};
		})();

		const contentTarget =
			explicitTarget ??
			(isZoomPreset ? (zoomContentTarget ?? "fullscreen") : "bound");
		const elementTarget = isZoomPreset
			? contentTarget
			: (explicitTarget ?? "bound");

		const elementRaw = compute(
			resolveComputeOptions({
				id,
				group,
				overrides: {
					...sharedOptions,
					raw: true,
					method: "transform",
					space: "relative",
					target: elementTarget,
				},
			}),
		) as Record<string, unknown>;

		const zoomFadeInComplete = 0.6;
		const zoomSourceFadeOutEnd = 1;

		const openingFade =
			props.progress <= 0.55
				? 0
				: interpolateClamped(props.progress, [0.55, 1], [0, 1]);
		const closingFadeFromZeroToOne = interpolateClamped(
			props.progress,
			[0, 1],
			[0, 1],
		);
		const closingFadeFromOneToTwo = interpolateClamped(
			props.progress,
			[1, 2],
			[1, 0],
		);
		const focusedFade =
			props.progress > 1 ? closingFadeFromOneToTwo : closingFadeFromZeroToOne;

		const focusedZoomFade =
			props.progress > 1
				? interpolateClamped(
						props.progress,
						[1, 1 + zoomFadeInComplete],
						[1, 0],
					)
				: interpolateClamped(props.progress, [0, zoomFadeInComplete], [0, 1]);

		const sourceZoomFade =
			props.progress <= 1 + zoomFadeInComplete
				? 1
				: interpolateClamped(
						props.progress,
						[1 + zoomFadeInComplete, 1 + zoomSourceFadeOutEnd],
						[1, 0],
					);

		const contentRaw = compute(
			resolveComputeOptions({
				id,
				group,
				overrides: {
					...sharedOptions,
					raw: true,
					method: "content",
					target: contentTarget,
				},
			}),
		) as Record<string, unknown>;

		const maskRaw = compute(
			resolveComputeOptions({
				id,
				group,
				overrides: {
					...sharedOptions,
					raw: true,
					method: "size",
					space: "absolute",
					target: "fullscreen",
				},
			}),
		) as Record<string, unknown>;

		if (props.focused) {
			return {
				[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]: {},
				[NAVIGATION_CONTAINER_STYLE_ID]: {
					opacity: isZoomPreset ? focusedZoomFade : focusedFade,
					transform: [
						{ translateX: toNumber(contentRaw.translateX) },
						{ translateY: toNumber(contentRaw.translateY) },
						{ scale: toNumber(contentRaw.scale, 1) },
					],
				},
				[NAVIGATION_MASK_STYLE_ID]: {
					width: toNumber(maskRaw.width),
					height: toNumber(maskRaw.height),
					transform: [
						{ translateX: toNumber(maskRaw.translateX) },
						{ translateY: toNumber(maskRaw.translateY) },
					],
					borderRadius: toNumber(navigationOptions?.maskBorderRadius, 0),
				},
			};
		}

		return {
			[resolvedTag]: {
				opacity: isZoomPreset ? sourceZoomFade : undefined,
				transform: [
					{ translateX: toNumber(elementRaw.translateX) },
					{ translateY: toNumber(elementRaw.translateY) },
					{ scaleX: toNumber(elementRaw.scaleX, 1) },
					{ scaleY: toNumber(elementRaw.scaleY, 1) },
				],
			},
		};
	};

	const boundsFunction = (params?: BoundsOptions) => {
		"worklet";
		const resolved = resolveComputeOptions({
			id: params?.id,
			group: params?.group,
			overrides: params,
		});

		return compute(resolved);
	};

	const match = (params: { id: string; group?: string }) => {
		"worklet";
		const { id, group } = params;

		return {
			style: (options?: BoundsMatchStyleOptions) => {
				"worklet";
				const resolved = resolveComputeOptions({
					id,
					group,
					overrides: { ...(options ?? {}), id, group },
				});

				return compute(resolved);
			},
			navigation: {
				hero: (options?: BoundsNavigationOptions) => {
					"worklet";
					return buildNavigationStyles({
						id,
						group,
						preset: "hero",
						navigationOptions: options,
					});
				},
				zoom: (options?: BoundsNavigationOptions) => {
					"worklet";
					return buildNavigationStyles({
						id,
						group,
						preset: "zoom",
						navigationOptions: options,
					});
				},
			},
		};
	};

	const getSnapshot = (tag: string, key: string): Snapshot | null => {
		"worklet";
		return BoundStore.getSnapshot(tag, key);
	};

	const getLink = (tag: string): BoundsLink | null => {
		"worklet";
		const link = BoundStore.getActiveLink(tag, props.current?.route.key);
		if (!link) return null;
		return {
			source: link.source
				? { bounds: link.source.bounds, styles: link.source.styles }
				: null,
			destination: link.destination
				? { bounds: link.destination.bounds, styles: link.destination.styles }
				: null,
		};
	};

	const interpolateStyle = (
		tag: string,
		property: string,
		fallback?: number,
	): number => {
		"worklet";
		const link = getLink(tag);
		const entering = !props.next;
		return interpolateLinkStyle(link, property, props.progress, entering, {
			fallback,
		});
	};

	const interpolateBounds = (
		tag: string,
		property: keyof MeasuredDimensions,
		fallbackOrTargetKey?: number | string,
		fallback?: number,
	): number => {
		"worklet";
		const entering = !props.next;
		const range = entering ? ENTER_RANGE : EXIT_RANGE;

		// If third param is a string, it's a targetKey (snapshot approach)
		if (typeof fallbackOrTargetKey === "string") {
			const targetKey = fallbackOrTargetKey;
			const currentKey = props.current?.route?.key;
			const fb = fallback ?? 0;

			const currentSnapshot = currentKey
				? BoundStore.getSnapshot(tag, currentKey)
				: null;
			const targetSnapshot = BoundStore.getSnapshot(tag, targetKey);

			const currentValue = currentSnapshot?.bounds?.[property] ?? fb;
			const targetValue = targetSnapshot?.bounds?.[property] ?? fb;

			return interpolateClamped(props.progress, range, [
				targetValue,
				currentValue,
			]);
		}

		// Otherwise, use link approach (existing behavior)
		const link = getLink(tag);
		const fb = fallbackOrTargetKey ?? 0;

		const sourceValue = link?.source?.bounds?.[property] ?? fb;
		const destValue = link?.destination?.bounds?.[property] ?? fb;

		return interpolateClamped(props.progress, range, [sourceValue, destValue]);
	};

	return Object.assign(boundsFunction, {
		match,
		getSnapshot,
		getLink,
		interpolateStyle,
		interpolateBounds,
	}) as BoundsAccessor;
};
