import { interpolate } from "react-native-reanimated";
import { createBoundsAccessorCore } from "../../helpers/create-bounds-accessor-core";
import { getSourceBorderRadius } from "../helpers";
import {
	CLOSE_SOURCE_HANDOFF_PROGRESS,
	CONTENT_CLOSING_OPACITY_OUTPUT,
	CONTENT_CLOSING_OPACITY_RANGE,
	CONTENT_ENTERING_OPACITY_OUTPUT,
	CONTENT_ENTERING_OPACITY_RANGE,
	CONTENT_SHADOW_OPACITY_OUTPUT,
	DISMISS_SCALE_ORBIT_DEPTH,
	DRAG_CLIP_HEIGHT_COLLAPSE_END,
	HORIZONTAL_DRAG_CLIP_COLLAPSE_SCALE,
	IDENTITY_DRAG_SCALE_OUTPUT,
	REVEAL_BACKGROUND_SCALE,
	REVEAL_BORDER_RADIUS,
	REVEAL_SHADOW_OFFSET,
	UNFOCUSED_ELEMENT_OPACITY_OUTPUT,
	ZERO_TO_ONE_RANGE,
} from "./config";
import {
	interpolateClamped,
	mixUnit,
	resolveAspectRatioClipHeight,
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
		layouts: { screen: screenLayout },
	} = props;
	const transitionProgress =
		props.current.transitionProgress + (props.next?.transitionProgress ?? 0);
	const activeTransitionProgress = props.active.transitionProgress;
	const borderRadius = revealOptions?.borderRadius ?? REVEAL_BORDER_RADIUS;
	const borderContinuous = revealOptions?.borderContinuous ?? true;
	const maxSensitivity = revealOptions?.maxSensitivity ?? 0.8;
	const velocityDepth =
		revealOptions?.velocityDepth ?? DISMISS_SCALE_ORBIT_DEPTH;
	const disablePointerEventsTillElementTransition =
		revealOptions?.disablePointerEventsTillElementTransition ?? true;
	const backgroundScale =
		revealOptions?.backgroundScale ?? REVEAL_BACKGROUND_SCALE;
	const shouldBackgroundScaleResetOnSettled =
		revealOptions?.shouldBackgroundScaleResetOnSettled ?? true;

	const bounds = createBoundsAccessorCore({
		getProps: () => props,
	});
	const scopedBounds = bounds(tag);
	const link = scopedBounds.link();

	if (link?.status !== "complete") {
		return {};
	}

	const sourceBorderRadius = getSourceBorderRadius(link);

	/* --------------------------- Gesture / Drag Values ------------------------- */

	const liveGesture = props.active.gesture;
	const gestureHandoff = liveGesture.handoff;
	const initialGesture = gestureHandoff.active;

	const isHorizontalDismiss =
		initialGesture === "horizontal" || initialGesture === "horizontal-inverted";
	const isVerticalDismiss =
		initialGesture === "vertical" || initialGesture === "vertical-inverted";

	const rawDrag = isHorizontalDismiss
		? Math.abs(gestureHandoff.raw.normX)
		: isVerticalDismiss
			? Math.abs(gestureHandoff.raw.normY)
			: 0;

	const dragX = resolveUnitDragTranslation(liveGesture.x, screenLayout.width);

	const dragY = resolveUnitDragTranslation(liveGesture.y, screenLayout.height);

	const dragXScale = isHorizontalDismiss
		? resolveRevealDirectionalDragScale(
				gestureHandoff.normX,
				initialGesture === "horizontal-inverted",
			)
		: IDENTITY_DRAG_SCALE_OUTPUT[0];

	const dragYScale = isVerticalDismiss
		? resolveRevealDirectionalDragScale(
				gestureHandoff.normY,
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
		const contentRaw = scopedBounds.values({
			scaleMode: "uniform",
			method: "content",
			target: initialDestinationTarget,
			progress: transitionProgress,
		});

		const clipRaw = scopedBounds.values({
			scaleMode: "uniform",
			method: "size",
			space: "absolute",
			target: "fullscreen",
			progress: transitionProgress,
		});

		const clipBorderRadius = mixUnit(
			sourceBorderRadius,
			borderRadius,
			activeTransitionProgress,
		);
		const clipBorderCurve = borderContinuous
			? ("continuous" as const)
			: undefined;

		const clipSizeMultiplier = props.active.closing
			? mixUnit(0.9, 1, activeTransitionProgress)
			: 1;

		const clipWidth = Math.max(1, clipRaw.width * clipSizeMultiplier);
		const clipHeight = Math.max(1, clipRaw.height * clipSizeMultiplier);

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
				progress: activeTransitionProgress,
				releaseScale: dragScale,
				targetScale: sourceContentScale,
				velocity: gestureHandoff.velocity,
				velocityDepth,
			});
		}

		const contentTranslateX = contentRaw.translateX + dragX;
		const contentTranslateY = contentRaw.translateY + dragY;

		const liveHorizontalDismissDrag =
			initialGesture === "horizontal-inverted"
				? -gestureHandoff.normX
				: gestureHandoff.normX;

		const liveVerticalDismissDrag =
			initialGesture === "vertical-inverted"
				? -gestureHandoff.normY
				: gestureHandoff.normY;

		const dismissProgressDrag = props.active.gesture.dismissing
			? 1 - activeTransitionProgress
			: 0;

		const clipHeightCollapseDrag =
			isHorizontalDismiss || isVerticalDismiss
				? Math.max(
						0,
						isHorizontalDismiss
							? liveHorizontalDismissDrag * HORIZONTAL_DRAG_CLIP_COLLAPSE_SCALE
							: 0,
						isVerticalDismiss ? liveVerticalDismissDrag : 0,
						dismissProgressDrag,
					)
				: 0;

		const clipAspectBounds = link.initialSource?.bounds ?? link.source.bounds;
		const minClipHeight = resolveAspectRatioClipHeight({
			clipWidth,
			clipHeight,
			targetWidth: clipAspectBounds.width,
			targetHeight: clipAspectBounds.height,
		});

		const renderedClipHeight = interpolateClamped(
			clipHeightCollapseDrag,
			0,
			DRAG_CLIP_HEIGHT_COLLAPSE_END,
			clipHeight,
			minClipHeight,
		);

		const clipCenteringOffsetX = (clipRaw.width - clipWidth) / 2;
		const clipCenteringOffsetY = (clipRaw.height - clipHeight) / 2;
		const verticalCollapseOffsetY =
			initialGesture === "vertical-inverted"
				? clipHeight - renderedClipHeight
				: 0;

		const contentCenterX = screenLayout.width / 2;
		const contentCenterY = screenLayout.height / 2;

		// The clip lives inside the transformed content container. Compensate only
		// for the reveal's base content scale; drag scale should be inherited from
		// the same parent transform as the screen content.
		const compensatedClipTranslateX =
			(clipRaw.translateX -
				contentRaw.translateX +
				clipCenteringOffsetX -
				(1 - contentBaseScale) * contentCenterX) /
			safeContentBaseScale;

		const compensatedClipTranslateY =
			(clipRaw.translateY -
				contentRaw.translateY +
				clipCenteringOffsetY +
				verticalCollapseOffsetY -
				(1 - contentBaseScale) * contentCenterY) /
			safeContentBaseScale;

		const clip = {
			x: compensatedClipTranslateX,
			y: compensatedClipTranslateY,
			width: clipWidth / safeContentBaseScale,
			height: renderedClipHeight / safeContentBaseScale,
			borderRadius: props.active.settled
				? 0
				: clipBorderRadius / safeContentBaseScale,
			borderCurve: clipBorderCurve,
		};

		const elementOffsetX = initialDestinationTarget
			? initialDestinationTarget.pageX - link.destination.bounds.pageX
			: 0;

		const elementOffsetY = initialDestinationTarget
			? initialDestinationTarget.pageY - link.destination.bounds.pageY
			: 0;

		const elementTX = props.active.closing
			? interpolateClamped(
					activeTransitionProgress,
					CLOSE_SOURCE_HANDOFF_PROGRESS,
					1,
					elementOffsetX,
					0,
				)
			: 0;
		const elementY = props.active.closing
			? interpolateClamped(
					activeTransitionProgress,
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
						activeTransitionProgress,
						ZERO_TO_ONE_RANGE,
						CONTENT_SHADOW_OPACITY_OUTPUT,
					),
					shadowRadius: 32,
					elevation: 5,
					opacity: props.active.entering
						? interpolate(
								activeTransitionProgress,
								CONTENT_ENTERING_OPACITY_RANGE,
								CONTENT_ENTERING_OPACITY_OUTPUT,
							)
						: interpolate(
								activeTransitionProgress,
								CONTENT_CLOSING_OPACITY_RANGE,
								CONTENT_CLOSING_OPACITY_OUTPUT,
							),
				},
			},
			clip,
			[link.id]: {
				style: {
					transform: [{ translateX: elementTX }, { translateY: elementY }],
				},
			},
		};
	}

	/* ---------------------------- Unfocused Screen ---------------------------- */

	const unfocusedScale = mixUnit(1, backgroundScale, activeTransitionProgress);
	const unfocusedContentScale =
		props.active.settled && shouldBackgroundScaleResetOnSettled
			? 1
			: unfocusedScale;

	const trackingContentTarget =
		initialDestinationTarget ?? link.destination.bounds;

	const trackingContentBaseTransform = resolveRevealContentBaseTransform({
		progress: activeTransitionProgress,
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
			progress: activeTransitionProgress,
			releaseScale: dragScale,
			targetScale: trackingTargetScale,
			velocity: gestureHandoff.velocity,
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
		content: {
			style: {
				transform: [{ scale: unfocusedContentScale }],
			},
			props: disablePointerEventsTillElementTransition
				? {
						pointerEvents:
							activeTransitionProgress <= CLOSE_SOURCE_HANDOFF_PROGRESS
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
							activeTransitionProgress,
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
