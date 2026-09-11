import type { MeasuredDimensions } from "react-native-reanimated";
import { interpolate } from "react-native-reanimated";
import type {
	ScreenTransitionState,
	TransitionClip,
} from "../../../../types/animation.types";
import type {
	BoundsLink,
	BoundsScopedAccessor,
} from "../../../../types/bounds.types";
import type { Layout } from "../../../../types/screen.types";
import type { BoundsAnchor } from "../../types/options";
import { toNumber } from "../helpers";
import { DRAG_CLIP_HEIGHT_COLLAPSE_END } from "../reveal/config";
import {
	interpolateClamped,
	resolveAspectRatioClipHeight,
} from "../reveal/math";
import { ZOOM_SHARED_OPTIONS } from "./config";
import type { ZoomDragState } from "./drag";

export const ZOOM_NAVIGATION_CLIP_BORDER_RADIUS = 64;
const ZOOM_VERTICAL_DRAG_CLIP_COLLAPSE_SCALE = 0.8;

interface ZoomClipProps {
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
	anchor: BoundsAnchor;
}

export function resolveZoomClip({
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
	anchor,
}: ZoomClipProps): TransitionClip {
	"worklet";

	const clipRaw = scopedBounds.values({
		scaleMode: ZOOM_SHARED_OPTIONS.scaleMode,
		anchor,
		method: "size",
		space: "absolute",
		target: "fullscreen",
		progress: transitionProgress,
	});
	const clipWidth = clipRaw.width;
	const clipHeight = clipRaw.height;
	const clipAspectBounds = link.initialSource?.bounds ?? sourceBounds;
	const minClipHeight = resolveAspectRatioClipHeight({
		clipWidth,
		clipHeight,
		targetWidth: clipAspectBounds.width,
		targetHeight: clipAspectBounds.height,
	});
	const clipHeightCollapseDrag = drag.collapsesClip
		? Math.max(
				0,
				drag.dismissNorm * ZOOM_VERTICAL_DRAG_CLIP_COLLAPSE_SCALE,
				drag.dismissProgress,
			)
		: 0;
	const renderedClipHeight = interpolateClamped(
		clipHeightCollapseDrag,
		0,
		DRAG_CLIP_HEIGHT_COLLAPSE_END,
		clipHeight,
		minClipHeight,
	);
	const contentCenterX = screenLayout.width / 2;
	const contentCenterY = screenLayout.height / 2;
	const clipOriginOffsetY = drag.isVerticalInverted
		? clipHeight - renderedClipHeight
		: 0;
	const compensatedClipTranslateX =
		(clipRaw.translateX -
			contentTransform.translateX -
			(1 - contentTransform.scale) * contentCenterX) /
		contentTransform.scale;
	const compensatedClipTranslateY =
		(clipRaw.translateY -
			contentTransform.translateY +
			clipOriginOffsetY -
			(1 - contentTransform.scale) * contentCenterY) /
		contentTransform.scale;
	const initialSourceBorderRadius = toNumber(
		link.initialSource?.styles.borderRadius,
		sourceBorderRadius,
	);

	return {
		x: compensatedClipTranslateX,
		y: compensatedClipTranslateY,
		width: clipWidth / contentTransform.scale,
		height: renderedClipHeight / contentTransform.scale,
		borderRadius:
			interpolate(
				transitionProgress,
				[0, 1],
				[
					initialSourceBorderRadius,
					active.animating ? expandedBorderRadius : 0,
				],
				"clamp",
			) / contentTransform.scale,
		borderCurve: "continuous",
	};
}
