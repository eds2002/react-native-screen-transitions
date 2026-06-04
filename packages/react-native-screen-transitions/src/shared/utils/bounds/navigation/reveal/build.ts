import { interpolate } from "react-native-reanimated";
import { NAVIGATION_MASK_ELEMENT_STYLE_ID } from "../../../../constants";
import { createLinkAccessor } from "../../helpers/create-link-accessor";
import { getSourceBorderRadius } from "../helpers";
import {
	CLOSE_SOURCE_HANDOFF_PROGRESS,
	CONTENT_CLOSING_OPACITY_OUTPUT,
	CONTENT_CLOSING_OPACITY_RANGE,
	CONTENT_ENTERING_OPACITY_OUTPUT,
	CONTENT_ENTERING_OPACITY_RANGE,
	CONTENT_SHADOW_OPACITY_OUTPUT,
	DISMISS_SCALE_ORBIT_DEPTH,
	DRAG_MASK_HEIGHT_COLLAPSE_END,
	HORIZONTAL_DRAG_MASK_COLLAPSE_SCALE,
	IDENTITY_DRAG_SCALE_OUTPUT,
	REVEAL_BACKGROUND_SCALE,
	REVEAL_BORDER_RADIUS,
	REVEAL_SHADOW_OFFSET,
	REVEAL_USES_TRANSFORM_MASK,
	UNFOCUSED_ELEMENT_OPACITY_OUTPUT,
	ZERO_TO_ONE_RANGE,
} from "./config";
import {
	interpolateClamped,
	mixUnit,
	resolveAspectRatioMaskHeight,
	resolveDismissScaleHandoff,
	resolveRevealContentBaseTransform,
	resolveRevealDirectionalDragScale,
	resolveRevealGestureHandoff,
	resolveSafeScale,
	resolveTrackedSourceElementTransform,
	resolveUniformScale,
	resolveUnitDragTranslation,
} from "./math";
import type { BuildRevealStylesParams, RevealInterpolatedStyle } from "./types";

/* -------------------------------------------------------------------------- */
/*                              BUILD REVEAL STYLES                           */
/* -------------------------------------------------------------------------- */

export function buildRevealStyles({
	tag,
	props,
	revealOptions,
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
	const borderRadius = revealOptions?.borderRadius ?? REVEAL_BORDER_RADIUS;
	const borderContinuous = revealOptions?.borderContinuous ?? true;
	const maxSensitivity = revealOptions?.maxSensitivity ?? 0.8;
	const velocityDepth =
		revealOptions?.velocityDepth ?? DISMISS_SCALE_ORBIT_DEPTH;
	const gestureProgressMode = revealOptions?.gestureProgressMode ?? "freeform";
	const disablePointerEventsTillElementTransition =
		revealOptions?.disablePointerEventsTillElementTransition ?? true;
	const maskSizingMode = revealOptions?.maskSizingMode ?? "auto";
	const backgroundScale =
		revealOptions?.backgroundScale ?? REVEAL_BACKGROUND_SCALE;
	const shouldBackgroundScaleResetOnSettled =
		revealOptions?.shouldBackgroundScaleResetOnSettled ?? true;
	const usesTransformMask =
		maskSizingMode === "auto"
			? REVEAL_USES_TRANSFORM_MASK
			: maskSizingMode === "transform";

	const boundsAccessor = createLinkAccessor(() => props);
	const link = boundsAccessor.getLink(tag);

	if (!link?.source?.bounds || !link.destination?.bounds) {
		return {};
	}

	const sourceBorderRadius = getSourceBorderRadius(link);

	/* --------------------------- Gesture / Drag Values ------------------------- */

	const initialGesture =
		props.active.gesture.active ?? props.active.gesture.direction;

	const isHorizontalDismiss =
		initialGesture === "horizontal" || initialGesture === "horizontal-inverted";
	const isVerticalDismiss =
		initialGesture === "vertical" || initialGesture === "vertical-inverted";

	const rawDrag = isHorizontalDismiss
		? Math.abs(props.active.gesture.raw.normX)
		: isVerticalDismiss
			? Math.abs(props.active.gesture.raw.normY)
			: 0;

	const dragX = resolveUnitDragTranslation(
		props.active.gesture.x,
		screenLayout.width,
	);

	const dragY = resolveUnitDragTranslation(
		props.active.gesture.y,
		screenLayout.height,
	);

	const dragXScale = isHorizontalDismiss
		? resolveRevealDirectionalDragScale(
				props.active.gesture.normX,
				initialGesture === "horizontal-inverted",
			)
		: IDENTITY_DRAG_SCALE_OUTPUT[0];

	const dragYScale = isVerticalDismiss
		? resolveRevealDirectionalDragScale(
				props.active.gesture.normY,
				initialGesture === "vertical-inverted",
			)
		: IDENTITY_DRAG_SCALE_OUTPUT[1];

	const dragScale = dragXScale * dragYScale;

	const initialDestinationTarget =
		props.active.closing && link.initialDestination?.bounds
			? link.initialDestination.bounds
			: undefined;

	/* ----------------------------- Focused Screen ----------------------------- */

	if (focused) {
		const contentRaw = link.compute({
			raw: true,
			scaleMode: "uniform",
			method: "content",
			target: initialDestinationTarget,
		} as const);

		const maskRaw = link.compute({
			raw: true,
			scaleMode: "uniform",
			method: "size",
			space: "absolute",
			target: "fullscreen",
		} as const);

		const maskBorderRadius = mixUnit(
			sourceBorderRadius,
			borderRadius,
			progress,
		);
		const maskBorderCurve = borderContinuous
			? ("continuous" as const)
			: undefined;

		const maskSizeMultiplier = props.active.closing
			? mixUnit(0.9, 1, props.active.progress)
			: 1;

		const maskWidth = Math.max(1, maskRaw.width * maskSizeMultiplier);
		const maskHeight = Math.max(1, maskRaw.height * maskSizeMultiplier);

		const contentBaseScale = contentRaw.scale;
		const safeContentBaseScale = resolveSafeScale(contentBaseScale);

		let contentScale = contentBaseScale * dragScale;
		if (props.active.gesture.dismissing) {
			const contentTargetBounds =
				initialDestinationTarget ?? link.destination.bounds;

			const sourceContentScale = resolveUniformScale({
				sourceWidth: link.source.bounds.width,
				sourceHeight: link.source.bounds.height,
				destinationWidth: contentTargetBounds.width,
				destinationHeight: contentTargetBounds.height,
			});

			contentScale = resolveDismissScaleHandoff({
				progress: props.active.progress,
				releaseScale: dragScale,
				targetScale: sourceContentScale,
				velocity: props.active.gesture.velocity,
				velocityDepth,
			});
		}

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

		const maskAspectBounds = link.initialSource?.bounds ?? link.source.bounds;
		const minMaskHeight = resolveAspectRatioMaskHeight({
			maskWidth,
			maskHeight,
			targetWidth: maskAspectBounds.width,
			targetHeight: maskAspectBounds.height,
		});

		const renderedMaskHeight = interpolateClamped(
			maskHeightCollapseDrag,
			0,
			DRAG_MASK_HEIGHT_COLLAPSE_END,
			maskHeight,
			minMaskHeight,
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
		const maskElementStyle = usesTransformMask
			? {
					width: maskBaseWidth,
					height: maskBaseHeight,
					borderRadius: props.active.settled ? 0 : maskBorderRadius,
					borderCurve: maskBorderCurve,
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
					borderCurve: maskBorderCurve,
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
			? interpolateClamped(
					props.active.progress,
					CLOSE_SOURCE_HANDOFF_PROGRESS,
					1,
					elementOffsetX,
					0,
				)
			: 0;
		const elementY = props.active.closing
			? interpolateClamped(
					props.active.progress,
					CLOSE_SOURCE_HANDOFF_PROGRESS,
					1,
					elementOffsetY,
					0,
				)
			: 0;

		const { gestureSensitivity, gestureReleaseVelocityScale } =
			resolveRevealGestureHandoff({
				rawDrag,
				maxSensitivity,
			});

		return {
			options: {
				gestureProgressMode,
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
					shadowOffset: REVEAL_SHADOW_OFFSET,
					shadowOpacity: interpolate(
						props.active.progress,
						ZERO_TO_ONE_RANGE,
						CONTENT_SHADOW_OPACITY_OUTPUT,
					),
					shadowRadius: 32,
					elevation: 5,
					opacity: props.active.entering
						? interpolate(
								props.active.progress,
								CONTENT_ENTERING_OPACITY_RANGE,
								CONTENT_ENTERING_OPACITY_OUTPUT,
							)
						: interpolate(
								props.active.progress,
								CONTENT_CLOSING_OPACITY_RANGE,
								CONTENT_CLOSING_OPACITY_OUTPUT,
							),
				},
			},
			[NAVIGATION_MASK_ELEMENT_STYLE_ID]: {
				style: maskElementStyle,
			},
			[link.id]: {
				style: {
					transform: [{ translateX: elementTX }, { translateY: elementY }],
				},
			},
		};
	}

	/* ---------------------------- Unfocused Screen ---------------------------- */

	const unfocusedScale = mixUnit(1, backgroundScale, props.active.progress);
	const unfocusedContentScale =
		props.active.settled && shouldBackgroundScaleResetOnSettled
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
	let trackingContentScale = trackingContentBaseTransform.scale * dragScale;
	if (props.active.gesture.dismissing) {
		const trackingTargetScale = resolveUniformScale({
			sourceWidth: link.source.bounds.width,
			sourceHeight: link.source.bounds.height,
			destinationWidth: trackingContentTarget.width,
			destinationHeight: trackingContentTarget.height,
		});
		trackingContentScale = resolveDismissScaleHandoff({
			progress: props.active.progress,
			releaseScale: dragScale,
			targetScale: trackingTargetScale,
			velocity: props.active.gesture.velocity,
			velocityDepth,
		});
	}
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
			gestureProgressMode,
		},
		content: {
			style: {
				transform: [{ scale: unfocusedContentScale }],
			},
			props: disablePointerEventsTillElementTransition
				? {
						pointerEvents:
							props.active.progress <= CLOSE_SOURCE_HANDOFF_PROGRESS
								? "auto"
								: "none",
					}
				: undefined,
		},
		[link.id]: {
			style: {
				opacity: props.active.closing
					? 1
					: interpolate(
							props.active.progress,
							ZERO_TO_ONE_RANGE,
							UNFOCUSED_ELEMENT_OPACITY_OUTPUT,
						),

				zIndex: 9999,
				elevation: 9999,
				transform: [
					{
						translateX: props.active.settled
							? 0
							: trackedSourceElement.translateX,
					},
					{
						translateY: props.active.settled
							? 0
							: trackedSourceElement.translateY,
					},
					{
						scaleX: props.active.settled ? 1 : trackedSourceElement.scaleX,
					},
					{
						scaleY: props.active.settled ? 1 : trackedSourceElement.scaleY,
					},
				],
			},
		},
	};
}
