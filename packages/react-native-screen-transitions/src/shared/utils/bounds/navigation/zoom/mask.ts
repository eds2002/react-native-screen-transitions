import type { MeasuredDimensions } from "react-native-reanimated";
import { interpolate } from "react-native-reanimated";
import type {
	ScreenTransitionState,
	TransitionSlotStyle,
} from "../../../../types/animation.types";
import type {
	BoundsLink,
	BoundsScopedAccessor,
} from "../../../../types/bounds.types";
import type { Layout } from "../../../../types/screen.types";
import { toNumber } from "../helpers";
import { DRAG_MASK_HEIGHT_COLLAPSE_END } from "../reveal/config";
import {
	interpolateClamped,
	resolveAspectRatioMaskHeight,
} from "../reveal/math";
import { ZOOM_SHARED_OPTIONS } from "./config";
import type { ZoomDragState } from "./drag";

export const ZOOM_NAVIGATION_MASK_BORDER_RADIUS = 64;
const ZOOM_VERTICAL_DRAG_MASK_COLLAPSE_SCALE = 0.8;

interface ZoomNavigationMaskStyleProps {
	scopedBounds: BoundsScopedAccessor;
	link: BoundsLink;
	sourceBounds: MeasuredDimensions;
	screenLayout: Layout;
	transitionProgress: number;
	drag: ZoomDragState;
	contentTransform: {
		translateX: number;
		translateY: number;
		scale: number;
	};
	sourceBorderRadius: number;
	expandedBorderRadius: number;
	active: ScreenTransitionState;
}

export function resolveZoomNavigationMaskStyle({
	scopedBounds,
	link,
	sourceBounds,
	screenLayout,
	transitionProgress,
	drag,
	contentTransform,
	sourceBorderRadius,
	expandedBorderRadius,
	active,
}: ZoomNavigationMaskStyleProps): TransitionSlotStyle {
	"worklet";

	const maskRaw = scopedBounds.values({
		scaleMode: ZOOM_SHARED_OPTIONS.scaleMode,
		anchor: ZOOM_SHARED_OPTIONS.anchor,
		method: "size",
		space: "absolute",
		target: "fullscreen",
		progress: transitionProgress,
	});
	const maskWidth = maskRaw.width;
	const maskHeight = maskRaw.height;
	const maskAspectBounds = link.initialSource?.bounds ?? sourceBounds;
	const minMaskHeight = resolveAspectRatioMaskHeight({
		maskWidth,
		maskHeight,
		targetWidth: maskAspectBounds.width,
		targetHeight: maskAspectBounds.height,
	});
	const maskHeightCollapseDrag = drag.collapsesMask
		? Math.max(
				0,
				drag.dismissNorm * ZOOM_VERTICAL_DRAG_MASK_COLLAPSE_SCALE,
				drag.dismissProgress,
			)
		: 0;
	const renderedMaskHeight = interpolateClamped(
		maskHeightCollapseDrag,
		0,
		DRAG_MASK_HEIGHT_COLLAPSE_END,
		maskHeight,
		minMaskHeight,
	);
	const maskCenterX = maskWidth / 2;
	const maskCenterY = renderedMaskHeight / 2;
	const contentCenterX = screenLayout.width / 2;
	const contentCenterY = screenLayout.height / 2;
	const maskOriginOffsetY = drag.isVerticalInverted
		? maskHeight - renderedMaskHeight
		: 0;
	const compensatedMaskTranslateX =
		(maskRaw.translateX -
			contentTransform.translateX +
			(1 - contentTransform.scale) * (maskCenterX - contentCenterX)) /
		contentTransform.scale;
	const compensatedMaskTranslateY =
		(maskRaw.translateY -
			contentTransform.translateY +
			maskOriginOffsetY +
			(1 - contentTransform.scale) * (maskCenterY - contentCenterY)) /
		contentTransform.scale;
	const initialSourceBorderRadius = toNumber(
		link.initialSource?.styles.borderRadius,
		sourceBorderRadius,
	);

	return {
		style: {
			width: maskWidth,
			height: renderedMaskHeight,
			borderRadius: interpolate(
				transitionProgress,
				[0, 1],
				[
					initialSourceBorderRadius,
					active.animating ? expandedBorderRadius : 0,
				],
				"clamp",
			),
			borderCurve: "continuous",
			transform: [
				{ translateX: compensatedMaskTranslateX },
				{ translateY: compensatedMaskTranslateY },
				{ scale: 1 / contentTransform.scale },
			],
		},
	};
}
