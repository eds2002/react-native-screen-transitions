import { interpolate } from "react-native-reanimated";
import {
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_HOST_FLAG_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
} from "../../../constants";
import { BoundStore } from "../../../stores/bounds.store";
import type { TransitionInterpolatedStyle } from "../../../types/animation.types";
import type {
	BoundsNavigationOptions,
	BoundsNavigationPreset,
} from "../../../types/bounds.types";
import type { Layout } from "../../../types/screen.types";
import { interpolateClamped } from "../helpers/interpolate";
import type { BoundsOptions } from "../types/options";

type ResolveTag = (params: {
	id?: string;
	group?: string;
}) => string | undefined;

type ComputeRaw = (
	overrides: Partial<BoundsOptions>,
) => Record<string, unknown>;

type BuildNavigationStylesParams = {
	id: string;
	group?: string;
	preset: BoundsNavigationPreset;
	navigationOptions?: BoundsNavigationOptions;
	focused: boolean;
	progress: number;
	currentProgress: number;
	currentRouteKey?: string;
	screenLayout: Layout;
	activeClosing: number;
	activeGestureX: number;
	activeGestureY: number;
	resolveTag: ResolveTag;
	computeRaw: ComputeRaw;
};

const NO_NAVIGATION_STYLE = Object.freeze({}) as TransitionInterpolatedStyle;
const ZOOM_FREEFORM_RESISTANCE = 0.2;
const ZOOM_MASK_SHRINK_X_MAX = 10;
const ZOOM_MASK_SHRINK_Y_MAX = 15;
const ZOOM_MASK_SHRINK_INPUT_MAX = 220;

const toNumber = (value: unknown, fallback = 0): number => {
	"worklet";
	return typeof value === "number" ? value : fallback;
};

const getZoomContentTarget = ({
	explicitTarget,
	resolvedTag,
	currentRouteKey,
	screenLayout,
}: {
	explicitTarget: BoundsOptions["target"] | undefined;
	resolvedTag: string;
	currentRouteKey?: string;
	screenLayout: Layout;
}) => {
	"worklet";
	if (explicitTarget !== undefined) return explicitTarget;

	const scopedLink = BoundStore.getActiveLink(resolvedTag, currentRouteKey);
	const latestLink = scopedLink ?? BoundStore.getActiveLink(resolvedTag);
	const sourceBounds = latestLink?.source?.bounds;
	const screenWidth = screenLayout.width;

	if (!sourceBounds || sourceBounds.width <= 0 || screenWidth <= 0) {
		return "fullscreen" as const;
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
};

const getClosingFade = (progress: number, isClosing: boolean) => {
	"worklet";
	if (!isClosing) {
		return 1;
	}

	return interpolateClamped(progress, [0, 1], [0, 1]);
};

export const buildNavigationStyles = ({
	id,
	group,
	preset,
	navigationOptions,
	focused,
	progress,
	currentProgress,
	currentRouteKey,
	screenLayout,
	activeClosing,
	activeGestureX,
	activeGestureY,
	resolveTag,
	computeRaw,
}: BuildNavigationStylesParams): TransitionInterpolatedStyle => {
	"worklet";

	const isZoomPreset = preset === "zoom";
	const defaultAnchor = isZoomPreset ? "top" : undefined;
	const defaultScaleMode = "uniform";

	const resolvedTag = resolveTag({ id, group });
	if (!resolvedTag) return NO_NAVIGATION_STYLE;

	const boundaryConfig = currentRouteKey
		? BoundStore.getBoundaryConfig(resolvedTag, currentRouteKey)
		: null;

	const sharedOptions: Partial<BoundsOptions> = {
		...(navigationOptions ?? {}),
		anchor:
			navigationOptions?.anchor ?? boundaryConfig?.anchor ?? defaultAnchor,
		scaleMode:
			navigationOptions?.scaleMode ??
			boundaryConfig?.scaleMode ??
			defaultScaleMode,
	};

	const explicitTarget = navigationOptions?.target ?? boundaryConfig?.target;

	const contentTarget = isZoomPreset
		? getZoomContentTarget({
				explicitTarget,
				resolvedTag,
				currentRouteKey,
				screenLayout,
			})
		: (explicitTarget ?? "bound");

	const elementTarget = isZoomPreset
		? contentTarget
		: (explicitTarget ?? "bound");

	const elementRaw = computeRaw({
		...sharedOptions,
		method: "transform",
		space: "relative",
		target: elementTarget,
	});

	const contentRaw = computeRaw({
		...sharedOptions,
		method: "content",
		target: contentTarget,
	});

	const maskRaw = computeRaw({
		...sharedOptions,
		method: "size",
		space: "absolute",
		target: "fullscreen",
	});

	const isClosing = activeClosing !== 0;
	const focusedFade = getClosingFade(currentProgress, isClosing);
	const unfocusedScale = interpolateClamped(progress, [1, 2], [1, 0.95]);
	const resistance = isZoomPreset ? ZOOM_FREEFORM_RESISTANCE : 1;
	const gestureX = activeGestureX * resistance;
	const gestureY = activeGestureY * resistance;
	const sourceGestureX = isZoomPreset ? gestureX : 0;
	const sourceGestureY = isZoomPreset ? gestureY : 0;
	const dragMagnitude = Math.abs(activeGestureX) + Math.abs(activeGestureY);
	const maskShrinkX = isZoomPreset
		? interpolate(
				dragMagnitude,
				[0, ZOOM_MASK_SHRINK_INPUT_MAX],
				[0, ZOOM_MASK_SHRINK_X_MAX],
			)
		: 0;
	const maskShrinkY = isZoomPreset
		? interpolate(
				dragMagnitude,
				[0, ZOOM_MASK_SHRINK_INPUT_MAX],
				[0, ZOOM_MASK_SHRINK_Y_MAX],
			)
		: 0;
	const rawMaskWidth = toNumber(maskRaw.width);
	const rawMaskHeight = toNumber(maskRaw.height);
	const maskWidth = Math.max(1, rawMaskWidth - maskShrinkX * 2);
	const maskHeight = Math.max(1, rawMaskHeight - maskShrinkY * 2);

	if (focused) {
		return {
			[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]: {},
			[NAVIGATION_CONTAINER_STYLE_ID]: {
				opacity: focusedFade,
				transform: [
					{ translateX: toNumber(contentRaw.translateX) + gestureX },
					{ translateY: toNumber(contentRaw.translateY) + gestureY },
					{ scale: toNumber(contentRaw.scale, 1) },
				],
			},
			[NAVIGATION_MASK_STYLE_ID]: {
				width: maskWidth,
				height: maskHeight,
				transform: [
					{
						translateX: toNumber(maskRaw.translateX) + gestureX + maskShrinkX,
					},
					{
						translateY: toNumber(maskRaw.translateY) + gestureY + maskShrinkY,
					},
				],
				borderRadius: toNumber(navigationOptions?.maskBorderRadius, 0),
			},
		};
	}

	return {
		contentStyle: isZoomPreset
			? {
					transform: [{ scale: unfocusedScale }],
				}
			: undefined,
		[resolvedTag]: {
			transform: [
				{ translateX: toNumber(elementRaw.translateX) + sourceGestureX },
				{ translateY: toNumber(elementRaw.translateY) + sourceGestureY },
				{ scaleX: toNumber(elementRaw.scaleX, 1) },
				{ scaleY: toNumber(elementRaw.scaleY, 1) },
			],
		},
	};
};
