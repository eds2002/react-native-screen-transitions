import { interpolate, type MeasuredDimensions } from "react-native-reanimated";
import {
	EPSILON,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../../constants";
import { createLinkAccessor } from "../../helpers/create-link-accessor";
import { computeContentTransformGeometry } from "../../helpers/geometry";
import { getSourceBorderRadius } from "../helpers";
import { combineScales, resolveDirectionalDragScale } from "../math";
import {
	CLOSE_SOURCE_HANDOFF_PROGRESS,
	DISMISS_SCALE_ORBIT_DEPTH,
	DRAG_DIRECTIONAL_SCALE_EXPONENT,
	DRAG_DIRECTIONAL_SCALE_MAX,
	DRAG_DIRECTIONAL_SCALE_MIN,
	DRAG_MASK_HEIGHT_COLLAPSE_END,
	HORIZONTAL_DRAG_MASK_COLLAPSE_SCALE,
	REVEAL_BORDER_RADIUS,
	REVEAL_USES_TRANSFORM_MASK,
} from "./config";
import { resolveDirectionalDragTranslation } from "./math";
import type { BuildRevealStylesParams, RevealInterpolatedStyle } from "./types";

const IDENTITY_DRAG_SCALE_OUTPUT = [1, 1] as const;

function resolveUniformScale({
	sourceWidth,
	sourceHeight,
	destinationWidth,
	destinationHeight,
}: {
	sourceWidth: number;
	sourceHeight: number;
	destinationWidth: number;
	destinationHeight: number;
}) {
	"worklet";

	const sx = sourceWidth / destinationWidth;
	const sy = sourceHeight / destinationHeight;

	const sourceAspect = sourceWidth / sourceHeight;
	const destinationAspect = destinationWidth / destinationHeight;
	const aspectDifference = Math.abs(sourceAspect - destinationAspect);

	return aspectDifference < 0.1 ? Math.max(sx, sy) : Math.min(sx, sy);
}

function resolveRevealGestureHandoff(rawDrag: number) {
	"worklet";

	const gestureSensitivity = interpolate(rawDrag, [0, 1], [0.8, 0.1], "clamp");

	const releaseBoost = interpolate(rawDrag, [0, 1], [1, 1.4], "clamp");

	const releaseSensitivity = interpolate(
		gestureSensitivity,
		[0.28, 0.9],
		[0.7, 1],
		"clamp",
	);

	return {
		gestureSensitivity,
		gestureReleaseVelocityScale: releaseBoost * releaseSensitivity,
	};
}

function resolveDismissScaleHandoff({
	progress,
	releaseScale,
	targetScale,
	rawDrag,
}: {
	progress: number;
	releaseScale: number;
	targetScale: number;
	rawDrag: number;
}) {
	"worklet";

	const closeProgress = 1 - progress;
	const scaleProgress = Math.sin((Math.PI / 2) * closeProgress);
	const baseScale = releaseScale + (targetScale - releaseScale) * scaleProgress;
	const orbitDepth = interpolate(
		rawDrag,
		[0, 1],
		[0, DISMISS_SCALE_ORBIT_DEPTH],
		"clamp",
	);
	const orbitScale = 1 - orbitDepth * Math.sin(Math.PI * closeProgress);

	return baseScale * orbitScale;
}

function getBoundsCenterX(bounds: MeasuredDimensions) {
	"worklet";
	return bounds.pageX + bounds.width / 2;
}

function getBoundsCenterY(bounds: MeasuredDimensions) {
	"worklet";
	return bounds.pageY + bounds.height / 2;
}

function resolveRevealContentBaseTransform({
	progress,
	sourceBounds,
	destinationBounds,
	screenLayout,
}: {
	progress: number;
	sourceBounds: MeasuredDimensions;
	destinationBounds: MeasuredDimensions;
	screenLayout: BuildRevealStylesParams["props"]["layouts"]["screen"];
}) {
	"worklet";

	const geometry = computeContentTransformGeometry({
		start: sourceBounds,
		end: destinationBounds,
		entering: true,
		dimensions: screenLayout,
		scaleMode: "uniform",
	});

	return {
		translateX: interpolate(progress, [0, 1], [geometry.tx, 0], "clamp"),
		translateY: interpolate(progress, [0, 1], [geometry.ty, 0], "clamp"),
		scale: interpolate(progress, [0, 1], [geometry.s, 1], "clamp"),
	};
}

function resolveTrackedSourceElementTransform({
	sourceBounds,
	destinationBounds,
	contentTranslateX,
	contentTranslateY,
	contentScale,
	parentScale,
	screenWidth,
	screenHeight,
}: {
	sourceBounds: MeasuredDimensions;
	destinationBounds: MeasuredDimensions;
	contentTranslateX: number;
	contentTranslateY: number;
	contentScale: number;
	parentScale: number;
	screenWidth: number;
	screenHeight: number;
}) {
	"worklet";

	const screenCenterX = screenWidth / 2;
	const screenCenterY = screenHeight / 2;
	const safeParentScale = Math.max(Math.abs(parentScale), EPSILON);
	const safeSourceWidth = Math.max(Math.abs(sourceBounds.width), EPSILON);
	const safeSourceHeight = Math.max(Math.abs(sourceBounds.height), EPSILON);

	const sourceCenterX = getBoundsCenterX(sourceBounds);
	const sourceCenterY = getBoundsCenterY(sourceBounds);
	const destinationCenterX = getBoundsCenterX(destinationBounds);
	const destinationCenterY = getBoundsCenterY(destinationBounds);

	const trackedCenterX =
		screenCenterX +
		(destinationCenterX - screenCenterX) * contentScale +
		contentTranslateX;
	const trackedCenterY =
		screenCenterY +
		(destinationCenterY - screenCenterY) * contentScale +
		contentTranslateY;

	return {
		translateX:
			(trackedCenterX - screenCenterX) / safeParentScale +
			screenCenterX -
			sourceCenterX,
		translateY:
			(trackedCenterY - screenCenterY) / safeParentScale +
			screenCenterY -
			sourceCenterY,
		scaleX:
			(destinationBounds.width * contentScale) /
			(safeSourceWidth * safeParentScale),
		scaleY:
			(destinationBounds.height * contentScale) /
			(safeSourceHeight * safeParentScale),
	};
}

/* -------------------------------------------------------------------------- */
/*                              BUILD REVEAL STYLES                           */
/* -------------------------------------------------------------------------- */

export function buildRevealStyles({
	tag,
	props,
}: BuildRevealStylesParams): RevealInterpolatedStyle {
	"worklet";

	if (!tag) {
		return {};
	}

	/* ------------------------------ Shared Setup ------------------------------ */

	const {
		focused,
		progress,
		layouts: { screen: screenLayout },
	} = props;

	const baseRawOptions = {
		raw: true,
		scaleMode: "uniform",
	} as const;

	const boundsAccessor = createLinkAccessor(() => props);
	const link = boundsAccessor.getLink(tag);

	if (!link?.source?.bounds || !link.destination?.bounds) {
		return {};
	}

	const sourceBorderRadius = getSourceBorderRadius(link);

	/* --------------------------- Gesture / Drag Values ------------------------- */

	const initialGesture =
		props.active.gesture.active ?? props.active.gesture.direction;

	const isHorizontalDismiss = initialGesture?.includes("horizontal");
	const isVerticalDismiss = initialGesture?.includes("vertical");

	const rawDrag = isHorizontalDismiss
		? Math.abs(props.active.gesture.raw.normX)
		: isVerticalDismiss
			? Math.abs(props.active.gesture.raw.normY)
			: 0;

	const dragX = resolveDirectionalDragTranslation({
		translation: props.active.gesture.x,
		dimension: screenLayout.width,
		negativeMax: 1,
		positiveMax: 1,
		exponent: 1,
	});

	const dragY = resolveDirectionalDragTranslation({
		translation: props.active.gesture.y,
		dimension: screenLayout.height,
		negativeMax: 1,
		positiveMax: 1,
		exponent: 1,
	});

	const dragXScale = isHorizontalDismiss
		? resolveDirectionalDragScale({
				normalized: props.active.gesture.normX,
				dismissDirection:
					initialGesture === "horizontal-inverted" ? "negative" : "positive",
				shrinkMin: DRAG_DIRECTIONAL_SCALE_MIN,
				growMax: DRAG_DIRECTIONAL_SCALE_MAX,
				exponent: DRAG_DIRECTIONAL_SCALE_EXPONENT,
			})
		: IDENTITY_DRAG_SCALE_OUTPUT[0];

	const dragYScale = isVerticalDismiss
		? resolveDirectionalDragScale({
				normalized: props.active.gesture.normY,
				dismissDirection:
					initialGesture === "vertical-inverted" ? "negative" : "positive",
				shrinkMin: DRAG_DIRECTIONAL_SCALE_MIN,
				growMax: DRAG_DIRECTIONAL_SCALE_MAX,
				exponent: DRAG_DIRECTIONAL_SCALE_EXPONENT,
			})
		: IDENTITY_DRAG_SCALE_OUTPUT[1];

	const dragScale = combineScales(dragXScale, dragYScale);

	const initialDestinationTarget =
		props.active.closing && link.initialDestination?.bounds
			? link.initialDestination.bounds
			: undefined;

	/* ----------------------------- Focused Screen ----------------------------- */

	if (focused) {
		const contentRaw = link.compute({
			...baseRawOptions,
			method: "content",
			target: initialDestinationTarget,
		});

		const maskRaw = link.compute({
			...baseRawOptions,
			method: "size",
			space: "absolute",
			target: "fullscreen",
		});

		const maskBorderRadius = interpolate(
			progress,
			[0, 1],
			[sourceBorderRadius, REVEAL_BORDER_RADIUS],
			"clamp",
		);

		const maskSizeMultiplier = props.active.closing
			? interpolate(props.active.progress, [0, 1], [0.9, 1], "clamp")
			: 1;

		const maskWidth = Math.max(1, maskRaw.width * maskSizeMultiplier);
		const maskHeight = Math.max(1, maskRaw.height * maskSizeMultiplier);

		const contentBaseScale = contentRaw.scale;
		const contentTargetBounds =
			initialDestinationTarget ?? link.destination.bounds;
		const sourceContentScale = resolveUniformScale({
			sourceWidth: link.source.bounds.width,
			sourceHeight: link.source.bounds.height,
			destinationWidth: contentTargetBounds.width,
			destinationHeight: contentTargetBounds.height,
		});
		const safeContentBaseScale =
			Math.abs(contentBaseScale) > EPSILON ? contentBaseScale : 1;

		const contentScale = props.active.gesture.dismissing
			? resolveDismissScaleHandoff({
					progress: props.active.progress,
					releaseScale: dragScale,
					targetScale: sourceContentScale,
					rawDrag,
				})
			: contentBaseScale * dragScale;
		const contentTranslateX = contentRaw.translateX + dragX;
		const contentTranslateY = contentRaw.translateY + dragY;

		const liveHorizontalDismissDrag =
			initialGesture === "horizontal-inverted"
				? -props.active.gesture.normX
				: props.active.gesture.normX;

		const liveVerticalDismissDrag =
			initialGesture === "vertical-inverted"
				? -props.active.gesture.normY
				: props.active.gesture.normY;

		const dismissProgressDrag = props.active.gesture.dismissing
			? 1 - props.active.progress
			: 0;

		const maskHeightCollapseDrag =
			isHorizontalDismiss || isVerticalDismiss
				? Math.max(
						0,
						isHorizontalDismiss
							? liveHorizontalDismissDrag * HORIZONTAL_DRAG_MASK_COLLAPSE_SCALE
							: 0,
						isVerticalDismiss ? liveVerticalDismissDrag : 0,
						dismissProgressDrag,
					)
				: 0;

		const minMaskHeight = Math.min(
			maskHeight,
			Math.max(maskWidth, link.source.bounds.height),
		);

		const renderedMaskHeight = interpolate(
			maskHeightCollapseDrag,
			[0, DRAG_MASK_HEIGHT_COLLAPSE_END],
			[maskHeight, minMaskHeight],
			"clamp",
		);

		const maskCenterX = maskWidth / 2;
		const maskCenterY = renderedMaskHeight / 2;
		const maskCenteringOffsetX = (maskRaw.width - maskWidth) / 2;
		const maskCenteringOffsetY = (maskRaw.height - maskHeight) / 2;
		const verticalCollapseOffsetY =
			initialGesture === "vertical-inverted"
				? maskHeight - renderedMaskHeight
				: 0;

		const contentCenterX = screenLayout.width / 2;
		const contentCenterY = screenLayout.height / 2;

		// The mask lives inside the transformed content container. Compensate only
		// for the reveal's base content scale; drag scale should be inherited from
		// the same parent transform as the screen content.
		const compensatedMaskTranslateX =
			(maskRaw.translateX -
				contentRaw.translateX +
				maskCenteringOffsetX +
				(1 - contentBaseScale) * (maskCenterX - contentCenterX)) /
			safeContentBaseScale;

		const compensatedMaskTranslateY =
			(maskRaw.translateY -
				contentRaw.translateY +
				maskCenteringOffsetY +
				verticalCollapseOffsetY +
				(1 - contentBaseScale) * (maskCenterY - contentCenterY)) /
			safeContentBaseScale;

		const compensatedMaskScale = 1 / safeContentBaseScale;
		const maskBaseWidth = Math.max(1, screenLayout.width);
		const maskBaseHeight = Math.max(1, screenLayout.height);
		const maskScaleX = maskWidth / maskBaseWidth;
		const maskScaleY = renderedMaskHeight / maskBaseHeight;
		const transformMaskTranslateX =
			compensatedMaskTranslateX + (maskWidth - maskBaseWidth) / 2;
		const transformMaskTranslateY =
			compensatedMaskTranslateY + (renderedMaskHeight - maskBaseHeight) / 2;
		const maskElementStyle = REVEAL_USES_TRANSFORM_MASK
			? {
					width: maskBaseWidth,
					height: maskBaseHeight,
					borderRadius: props.active.settled ? 0 : maskBorderRadius,
					borderCurve: "continuous" as const,
					transform: [
						{ translateX: transformMaskTranslateX },
						{ translateY: transformMaskTranslateY },
						{ scaleX: maskScaleX * compensatedMaskScale },
						{ scaleY: maskScaleY * compensatedMaskScale },
					],
				}
			: {
					width: maskWidth,
					height: renderedMaskHeight,
					borderRadius: props.active.settled ? 0 : maskBorderRadius,
					borderCurve: "continuous" as const,
					transform: [
						{ translateX: compensatedMaskTranslateX },
						{ translateY: compensatedMaskTranslateY },
						{ scale: compensatedMaskScale },
					],
				};

		const elementOffsetX = initialDestinationTarget
			? initialDestinationTarget.pageX - link.destination.bounds.pageX
			: 0;

		const elementOffsetY = initialDestinationTarget
			? initialDestinationTarget.pageY - link.destination.bounds.pageY
			: 0;

		const elementTX = props.active.closing
			? interpolate(
					props.active.progress,
					[CLOSE_SOURCE_HANDOFF_PROGRESS, 1],
					[elementOffsetX, 0],
					"clamp",
				)
			: 0;
		const elementY = props.active.closing
			? interpolate(
					props.active.progress,
					[CLOSE_SOURCE_HANDOFF_PROGRESS, 1],
					[elementOffsetY, 0],
					"clamp",
				)
			: 0;

		const { gestureSensitivity, gestureReleaseVelocityScale } =
			resolveRevealGestureHandoff(rawDrag);

		return {
			options: {
				gestureProgressMode: "freeform",
				gestureSensitivity,
				gestureReleaseVelocityScale,
			},
			content: {
				style: {
					transform: [
						{ translateX: contentTranslateX },
						{ translateY: contentTranslateY },
						{ scale: contentScale },
					],
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: interpolate(props.active.progress, [0, 1], [0, 0.25]),
					shadowRadius: 32,
					elevation: 5,
					opacity: props.active.entering
						? interpolate(
								props.active.progress,
								[0, CLOSE_SOURCE_HANDOFF_PROGRESS],
								[0, 1],
							)
						: interpolate(
								props.active.progress,
								[0, CLOSE_SOURCE_HANDOFF_PROGRESS, 1],
								[0, 1, 1],
							),
				},
			},
			[NAVIGATION_MASK_ELEMENT_STYLE_ID]: {
				style: maskElementStyle,
			},
			[link.id]: {
				style: {
					position: "relative",
					zIndex: 999,
					transform: [{ translateX: elementTX }, { translateY: elementY }],
				},
			},
		};
	}

	/* ---------------------------- Unfocused Screen ---------------------------- */

	const unfocusedScale = interpolate(
		props.active.progress,
		[0, 1],
		[1, 0.9375],
		"clamp",
	);
	const unfocusedContentScale = props.active.logicallySettled
		? 1
		: unfocusedScale;

	const trackingContentTarget =
		initialDestinationTarget ?? link.destination.bounds;

	const trackingContentBaseTransform = resolveRevealContentBaseTransform({
		progress: props.active.progress,
		sourceBounds: link.source.bounds,
		destinationBounds: trackingContentTarget,
		screenLayout,
	});
	const trackingTargetScale = resolveUniformScale({
		sourceWidth: link.source.bounds.width,
		sourceHeight: link.source.bounds.height,
		destinationWidth: trackingContentTarget.width,
		destinationHeight: trackingContentTarget.height,
	});
	const trackingContentScale = props.active.gesture.dismissing
		? resolveDismissScaleHandoff({
				progress: props.active.progress,
				releaseScale: dragScale,
				targetScale: trackingTargetScale,
				rawDrag,
			})
		: trackingContentBaseTransform.scale * dragScale;
	const trackingContentTranslateX =
		trackingContentBaseTransform.translateX + dragX;
	const trackingContentTranslateY =
		trackingContentBaseTransform.translateY + dragY;
	const trackedSourceElement = resolveTrackedSourceElementTransform({
		sourceBounds: link.source.bounds,
		destinationBounds: trackingContentTarget,
		contentTranslateX: trackingContentTranslateX,
		contentTranslateY: trackingContentTranslateY,
		contentScale: trackingContentScale,
		parentScale: unfocusedContentScale,
		screenWidth: screenLayout.width,
		screenHeight: screenLayout.height,
	});

	return {
		options: {
			gestureProgressMode: "freeform",
		},
		content: {
			style: {
				transform: [{ scale: unfocusedContentScale }],
			},
			props: {
				pointerEvents:
					props.active.progress <= CLOSE_SOURCE_HANDOFF_PROGRESS
						? "auto"
						: "none",
			},
		},
		[link.id]: {
			style: {
				opacity: props.active.closing
					? 1
					: interpolate(props.active.progress, [0, 1], [1, 0], "clamp"),

				zIndex: 9999,
				elevation: 9999,
				transform: [
					{
						translateX: props.active.logicallySettled
							? 0
							: trackedSourceElement.translateX,
					},
					{
						translateY: props.active.logicallySettled
							? 0
							: trackedSourceElement.translateY,
					},
					{
						scaleX: props.active.logicallySettled
							? 1
							: trackedSourceElement.scaleX,
					},
					{
						scaleY: props.active.logicallySettled
							? 1
							: trackedSourceElement.scaleY,
					},
				],
			},
		},
	};
}
