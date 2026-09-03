import { interpolate } from "react-native-reanimated";
import { NAVIGATION_MASK_ELEMENT_STYLE_ID } from "../../../../constants";
import type { AnimatedViewStyle } from "../../../../types/animation.types";
import { createBoundsAccessorCore } from "../../helpers/create-bounds-accessor-core";
import { getSourceBorderRadius } from "../helpers";
import {
	adaptRevealFocusedContentClip,
	adaptRevealNavigationMaskClip,
} from "./adapter";
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
import {
	projectRevealContentClip,
	projectRevealNavigationMaskClip,
} from "./projector";
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
	const initialGesture = gestureHandoff.active ?? gestureHandoff.direction;

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

		const maskRaw = scopedBounds.values({
			scaleMode: "uniform",
			method: "size",
			space: "absolute",
			target: "fullscreen",
			progress: transitionProgress,
		});

		const maskBorderRadius = mixUnit(
			sourceBorderRadius,
			borderRadius,
			activeTransitionProgress,
		);
		const maskBorderCurve = borderContinuous
			? ("continuous" as const)
			: ("circular" as const);

		const maskSizeMultiplier = props.active.closing
			? mixUnit(0.9, 1, activeTransitionProgress)
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
		const maskElementStyle: AnimatedViewStyle = {
			width: maskWidth,
			height: renderedMaskHeight,
			borderRadius: props.active.settled ? 0 : maskBorderRadius,
			borderCurve: borderContinuous ? "continuous" : undefined,
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
		const contentOpacity = props.active.entering
			? interpolate(
					activeTransitionProgress,
					CONTENT_ENTERING_OPACITY_RANGE,
					CONTENT_ENTERING_OPACITY_OUTPUT,
				)
			: interpolate(
					activeTransitionProgress,
					CONTENT_CLOSING_OPACITY_RANGE,
					CONTENT_CLOSING_OPACITY_OUTPUT,
				);
		const contentShadowOpacity = interpolate(
			activeTransitionProgress,
			ZERO_TO_ONE_RANGE,
			CONTENT_SHADOW_OPACITY_OUTPUT,
		);
		const contentResidualStyle: AnimatedViewStyle = {
			opacity: contentOpacity,
		};
		const legacyContentShadowStyle: AnimatedViewStyle = {
			boxShadow: [
				{
					color: `rgba(0, 0, 0, ${contentShadowOpacity})`,
					offsetX: 0,
					offsetY: 2,
					blurRadius: 64,
					spreadDistance: 0,
				},
			],
		};
		const legacyContentStyle: AnimatedViewStyle = {
			transform: [
				{ translateX: contentTranslateX },
				{ translateY: contentTranslateY },
				{ scale: contentScale },
			],
			...contentResidualStyle,
			...legacyContentShadowStyle,
		};
		const contentClip = projectRevealContentClip({
			screenLayout,
			translateX: contentTranslateX,
			translateY: contentTranslateY,
			scale: contentScale,
			shadowOpacity: contentShadowOpacity,
		});
		const maskClip = projectRevealNavigationMaskClip({
			width: maskWidth,
			height: renderedMaskHeight,
			translateX: compensatedMaskTranslateX,
			translateY: compensatedMaskTranslateY,
			scale: compensatedMaskScale,
			radius: props.active.settled ? 0 : maskBorderRadius,
			curve: maskBorderCurve,
		});

		const projectEndpointClips = (progress: 0 | 1) => {
			"worklet";
			const endpointContentRaw = scopedBounds.values({
				scaleMode: "uniform",
				method: "content",
				target: initialDestinationTarget,
				progress,
			});
			const endpointMaskRaw = scopedBounds.values({
				scaleMode: "uniform",
				method: "size",
				space: "absolute",
				target: "fullscreen",
				progress,
			});
			const endpointMaskMultiplier = props.active.closing
				? mixUnit(0.9, 1, progress)
				: 1;
			const endpointMaskWidth = Math.max(
				1,
				endpointMaskRaw.width * endpointMaskMultiplier,
			);
			const endpointMaskHeight = Math.max(
				1,
				endpointMaskRaw.height * endpointMaskMultiplier,
			);
			const endpointMaskAspectBounds =
				link.initialSource?.bounds ?? link.source.bounds;
			const endpointMinMaskHeight = resolveAspectRatioMaskHeight({
				maskWidth: endpointMaskWidth,
				maskHeight: endpointMaskHeight,
				targetWidth: endpointMaskAspectBounds.width,
				targetHeight: endpointMaskAspectBounds.height,
			});
			const endpointMaskCollapse =
				props.active.gesture.dismissing && progress === 0 ? 1 : 0;
			const endpointRenderedMaskHeight = interpolateClamped(
				endpointMaskCollapse,
				0,
				DRAG_MASK_HEIGHT_COLLAPSE_END,
				endpointMaskHeight,
				endpointMinMaskHeight,
			);
			const endpointContentTargetBounds =
				initialDestinationTarget ?? link.destination.bounds;
			const endpointTargetScale = resolveUniformScale({
				sourceWidth: link.source.bounds.width,
				sourceHeight: link.source.bounds.height,
				destinationWidth: endpointContentTargetBounds.width,
				destinationHeight: endpointContentTargetBounds.height,
			});
			const endpointContentScale = props.active.gesture.dismissing
				? resolveDismissScaleHandoff({
						progress,
						releaseScale: dragScale,
						targetScale: endpointTargetScale,
						velocity: gestureHandoff.velocity,
						velocityDepth,
					})
				: endpointContentRaw.scale;
			const endpointSafeContentScale = resolveSafeScale(
				endpointContentRaw.scale,
			);
			const endpointMaskCenterX = endpointMaskWidth / 2;
			const endpointMaskCenterY = endpointRenderedMaskHeight / 2;
			const endpointMaskCenteringOffsetX =
				(endpointMaskRaw.width - endpointMaskWidth) / 2;
			const endpointMaskCenteringOffsetY =
				(endpointMaskRaw.height - endpointMaskHeight) / 2;
			const endpointVerticalCollapseOffsetY =
				initialGesture === "vertical-inverted"
					? endpointMaskHeight - endpointRenderedMaskHeight
					: 0;
			const endpointMaskTranslateX =
				(endpointMaskRaw.translateX -
					endpointContentRaw.translateX +
					endpointMaskCenteringOffsetX +
					(1 - endpointContentRaw.scale) *
						(endpointMaskCenterX - contentCenterX)) /
				endpointSafeContentScale;
			const endpointMaskTranslateY =
				(endpointMaskRaw.translateY -
					endpointContentRaw.translateY +
					endpointMaskCenteringOffsetY +
					endpointVerticalCollapseOffsetY +
					(1 - endpointContentRaw.scale) *
						(endpointMaskCenterY - contentCenterY)) /
				endpointSafeContentScale;

			return {
				content: projectRevealContentClip({
					screenLayout,
					translateX: endpointContentRaw.translateX,
					translateY: endpointContentRaw.translateY,
					scale: endpointContentScale,
					shadowOpacity: interpolate(
						progress,
						ZERO_TO_ONE_RANGE,
						CONTENT_SHADOW_OPACITY_OUTPUT,
					),
				}),
				mask: projectRevealNavigationMaskClip({
					width: endpointMaskWidth,
					height: endpointRenderedMaskHeight,
					translateX: endpointMaskTranslateX,
					translateY: endpointMaskTranslateY,
					scale: 1 / endpointSafeContentScale,
					radius: mixUnit(sourceBorderRadius, borderRadius, progress),
					curve: maskBorderCurve,
				}),
			};
		};
		const endpoint0 = projectEndpointClips(0);
		const endpoint1 = projectEndpointClips(1);
		const contentEndpointClips = {
			...(endpoint0.content === null ? {} : { "0": endpoint0.content }),
			...(endpoint1.content === null ? {} : { "1": endpoint1.content }),
		};
		const maskEndpointClips = {
			...(endpoint0.mask === null ? {} : { "0": endpoint0.mask }),
			...(endpoint1.mask === null ? {} : { "1": endpoint1.mask }),
		};

		return {
			options: {
				gestureSensitivity,
				gestureReleaseVelocityScale,
			},
			content: adaptRevealFocusedContentClip({
				endpointClips: contentEndpointClips,
				projectedClip: contentClip,
				legacyStyle: legacyContentStyle,
				residualStyle: contentResidualStyle,
			}),
			[NAVIGATION_MASK_ELEMENT_STYLE_ID]: adaptRevealNavigationMaskClip({
				endpointClips: maskEndpointClips,
				projectedClip: maskClip,
				legacyStyle: maskElementStyle,
			}),
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
