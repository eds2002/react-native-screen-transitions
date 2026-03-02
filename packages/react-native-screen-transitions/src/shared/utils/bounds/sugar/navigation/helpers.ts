import { BoundStore } from "../../../../stores/bounds";
import type {
	BoundsNavigationZoomOptions,
	ZoomEdgeInsets,
	ZoomRadiusValue,
} from "../../../../types/bounds.types";
import type { BoundsOptions } from "../../types/options";
import type { ResolveTag } from "./types";

const DEFAULT_DRAG_RESISTANCE = 0.4;
const DEFAULT_DRAG_DIRECTIONAL_SCALE_MIN = 0.25;
const DEFAULT_MASK_BORDER_RADIUS: ZoomRadiusValue = 12;

const ZERO_OUTSET = Object.freeze({
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
});

type ResolvedZoomOutset = {
	top: number;
	right: number;
	bottom: number;
	left: number;
};

export type ResolvedNavigationZoomOptions = {
	mask: {
		borderRadius: ZoomRadiusValue;
		borderTopLeftRadius?: ZoomRadiusValue;
		borderTopRightRadius?: ZoomRadiusValue;
		borderBottomLeftRadius?: ZoomRadiusValue;
		borderBottomRightRadius?: ZoomRadiusValue;
		borderCurve?: "circular" | "continuous";
		outset: ResolvedZoomOutset;
	};
	motion: {
		dragResistance: number;
		dragDirectionalScaleMin: number;
	};
};

export const toNumber = (value: unknown, fallback = 0): number => {
	"worklet";
	return typeof value === "number" ? value : fallback;
};

const isFiniteNumber = (value: unknown): value is number => {
	"worklet";
	return typeof value === "number" && Number.isFinite(value);
};

const normalizeOutset = (value?: ZoomEdgeInsets): ResolvedZoomOutset => {
	"worklet";
	if (typeof value === "number") {
		return {
			top: value,
			right: value,
			bottom: value,
			left: value,
		};
	}

	if (!value) {
		return ZERO_OUTSET;
	}

	return {
		top: isFiniteNumber(value.top) ? value.top : 0,
		right: isFiniteNumber(value.right) ? value.right : 0,
		bottom: isFiniteNumber(value.bottom) ? value.bottom : 0,
		left: isFiniteNumber(value.left) ? value.left : 0,
	};
};

const normalizeZoomOptions = (
	navigationOptions?: BoundsNavigationZoomOptions,
): ResolvedNavigationZoomOptions => {
	"worklet";

	const resolvedMaskRadius =
		navigationOptions?.mask?.borderRadius ??
		(isFiniteNumber(navigationOptions?.maskBorderRadius)
			? navigationOptions?.maskBorderRadius
			: DEFAULT_MASK_BORDER_RADIUS);

	return {
		mask: {
			borderRadius: resolvedMaskRadius,
			borderTopLeftRadius: navigationOptions?.mask?.borderTopLeftRadius,
			borderTopRightRadius: navigationOptions?.mask?.borderTopRightRadius,
			borderBottomLeftRadius: navigationOptions?.mask?.borderBottomLeftRadius,
			borderBottomRightRadius: navigationOptions?.mask?.borderBottomRightRadius,
			borderCurve: navigationOptions?.mask?.borderCurve,
			outset: normalizeOutset(navigationOptions?.mask?.outset),
		},
		motion: {
			dragResistance: isFiniteNumber(navigationOptions?.motion?.dragResistance)
				? navigationOptions.motion.dragResistance
				: DEFAULT_DRAG_RESISTANCE,
			dragDirectionalScaleMin: isFiniteNumber(
				navigationOptions?.motion?.dragDirectionalScaleMin,
			)
				? navigationOptions.motion.dragDirectionalScaleMin
				: DEFAULT_DRAG_DIRECTIONAL_SCALE_MIN,
		},
	};
};

export const resolveNavigationConfig = ({
	id,
	group,
	navigationOptions,
	currentRouteKey,
	resolveTag,
	defaultAnchor,
}: {
	id: string;
	group?: string;
	navigationOptions?: BoundsNavigationZoomOptions;
	currentRouteKey?: string;
	resolveTag: ResolveTag;
	defaultAnchor: BoundsOptions["anchor"] | undefined;
}): {
	resolvedTag: string;
	sharedOptions: Partial<BoundsOptions>;
	explicitTarget: BoundsOptions["target"] | undefined;
	zoomOptions: ResolvedNavigationZoomOptions;
} | null => {
	"worklet";
	const resolvedTag = resolveTag({ id, group });
	if (!resolvedTag) return null;

	// Try direct boundary config for the current screen first.
	const boundaryConfig = currentRouteKey
		? BoundStore.getBoundaryConfig(resolvedTag, currentRouteKey)
		: null;

	// Fallback: when the current screen has no Boundary (e.g. a zoom detail
	// screen without a destination element), inherit config from the link's
	// source screen so that props like scaleMode propagate to both sides.
	let effectiveConfig = boundaryConfig;
	if (!effectiveConfig) {
		// For no-destination navigation zoom, the focused route won't appear in
		// a completed link yet. Fall back to the latest unscoped link so source
		// boundary defaults (anchor/scaleMode/target) still propagate.
		const scopedLink = currentRouteKey
			? BoundStore.getActiveLink(resolvedTag, currentRouteKey)
			: null;
		const link = scopedLink ?? BoundStore.getActiveLink(resolvedTag);
		if (link?.source) {
			effectiveConfig = BoundStore.getBoundaryConfig(
				resolvedTag,
				link.source.screenKey,
			);
		}
	}

	const sharedOptions: Partial<BoundsOptions> = {
		anchor:
			navigationOptions?.anchor ?? effectiveConfig?.anchor ?? defaultAnchor,
		scaleMode:
			navigationOptions?.scaleMode ?? effectiveConfig?.scaleMode ?? "uniform",
	};

	const explicitTarget = navigationOptions?.target ?? effectiveConfig?.target;
	const zoomOptions = normalizeZoomOptions(navigationOptions);

	return {
		resolvedTag,
		sharedOptions,
		explicitTarget,
		zoomOptions,
	};
};
