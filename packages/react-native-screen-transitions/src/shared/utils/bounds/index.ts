import type { MeasuredDimensions } from "react-native-reanimated";
import {
	EMPTY_BOUND_HELPER_RESULT,
	EMPTY_BOUND_HELPER_RESULT_RAW,
	ENTER_RANGE,
	EXIT_RANGE,
	FULLSCREEN_DIMENSIONS,
} from "../../constants";
import { BoundStore, type Snapshot } from "../../stores/bounds.store";
import type {
	ScreenInterpolationProps,
	ScreenTransitionState,
} from "../../types/animation.types";
import type {
	BoundsAccessor,
	BoundsLink,
	BoundsNavigationOptions,
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
import { buildNavigationStyles } from "./sugar/navigation";
import type { BoundsComputeParams, BoundsOptions } from "./types/options";

const DEFAULT_BOUNDS_OPTIONS = {
	target: "bound",
	method: "transform",
	space: "relative",
	scaleMode: "match",
	anchor: "center",
	raw: false,
} as const satisfies Omit<BoundsOptions, "id" | "group" | "gestures">;

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
		mode = "style",
	}: {
		id?: string;
		group?: string;
		overrides?: Partial<BoundsOptions>;
		mode?: "style" | "navigation";
	}): BoundsOptions => {
		"worklet";
		const tag = resolveTag({ id, group });
		const currentScreenKey = props.current?.route.key;
		const boundaryConfig =
			tag && currentScreenKey
				? BoundStore.getBoundaryConfig(tag, currentScreenKey)
				: null;

		const resolved = {
			...DEFAULT_BOUNDS_OPTIONS,
			...(boundaryConfig ?? {}),
			...(overrides ?? {}),
			id: tag ?? "",
			group,
		};

		// Element-level bounds style composition always uses relative space.
		// Absolute space is reserved for internal navigation helpers (masking).
		if (mode === "style") {
			resolved.space = "relative";
		}

		return resolved;
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

	const navigationStyles = (
		id: string,
		group: string | undefined,
		preset: "hero" | "zoom",
		navigationOptions?: BoundsNavigationOptions,
	) => {
		"worklet";
		return buildNavigationStyles({
			id,
			group,
			preset,
			navigationOptions,
			props,
			resolveTag,
			computeRaw: (overrides) =>
				compute(
					resolveComputeOptions({
						id,
						group,
						overrides: {
							...(overrides ?? {}),
							raw: true,
						},
						mode: "navigation",
					}),
				) as Record<string, unknown>,
		});
	};

	const createNavigationAccessor = (id?: string, group?: string) => {
		"worklet";

		const resolvedId = id ?? "";

		return {
			hero: (options?: BoundsNavigationOptions) => {
				"worklet";
				return navigationStyles(resolvedId, group, "hero", options);
			},
			zoom: (options?: BoundsNavigationOptions) => {
				"worklet";
				return navigationStyles(resolvedId, group, "zoom", options);
			},
		};
	};

	const boundsFunction = (params?: BoundsOptions) => {
		"worklet";
		const resolved = resolveComputeOptions({
			id: params?.id,
			group: params?.group,
			overrides: params,
			mode: "style",
		});

		const computed = compute(resolved) as Record<string, unknown>;
		const navigation = createNavigationAccessor(params?.id, params?.group);
		const target = Object.isExtensible(computed) ? computed : { ...computed };

		Object.defineProperty(target, "navigation", {
			value: navigation,
			enumerable: false,
			configurable: true,
		});

		return target as typeof computed & { navigation: typeof navigation };
	};

	const getSnapshot = (tag: string, key?: string): Snapshot | null => {
		"worklet";
		if (!key) return null;
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
		getSnapshot,
		getLink,
		interpolateStyle,
		interpolateBounds,
	}) as BoundsAccessor;
};
