import { interpolate } from "react-native-reanimated";
import {
	EPSILON,
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	VISIBLE_STYLE,
} from "../../../../constants";
import type {
	ScreenTransitionOptions,
	TransitionInterpolatedStyle,
} from "../../../../types/animation.types";
import { createLinkAccessor } from "../../helpers/create-link-accessor";
import { getSourceBorderRadius, toNumber } from "../helpers";
import {
	combineScales,
	composeCompensatedTranslation,
	computeCenterScaleShift,
	resolveDirectionalDragScale,
	resolveOpacityRangeTuple,
} from "../math";
import {
	ZOOM_DISMISS_SCALE_ORBIT_DEPTH,
	ZOOM_FOCUSED_ELEMENT_CLOSE_OPACITY_RANGE,
	ZOOM_FOCUSED_ELEMENT_OPEN_OPACITY_RANGE,
	ZOOM_MASK_OUTSET,
	ZOOM_SHARED_OPTIONS,
	ZOOM_UNFOCUSED_ELEMENT_CLOSE_OPACITY_RANGE,
	ZOOM_UNFOCUSED_ELEMENT_OPEN_OPACITY_RANGE,
} from "./config";
import {
	getZoomContentTarget,
	interpolateOpacityRange,
	resolveBackgroundScale,
	resolveDragScaleTuple,
	resolveDragTranslationTuple,
} from "./helpers";
import { resolveDirectionalDragTranslation } from "./math";
import type { BuildZoomStylesParams, ZoomInterpolatedStyle } from "./types";

const IDENTITY_DRAG_SCALE_OUTPUT = [1, 1] as const;

function resolveZoomGestureHandoff(rawDrag: number) {
	"worklet";

	const gestureSensitivity = interpolate(rawDrag, [0, 1], [0.7, 0.1], "clamp");
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

function resolveZoomGestureOptions({
	rawDrag,
	activeOptions,
}: {
	rawDrag: number;
	activeOptions: ScreenTransitionOptions;
}) {
	"worklet";

	const { gestureSensitivity, gestureReleaseVelocityScale } =
		resolveZoomGestureHandoff(rawDrag);

	return {
		gestureProgressMode: activeOptions.gestureProgressMode ?? "freeform",
		gestureSensitivity: activeOptions.gestureSensitivity ?? gestureSensitivity,
		gestureReleaseVelocityScale:
			activeOptions.gestureReleaseVelocityScale ?? gestureReleaseVelocityScale,
	};
}

function resolveZoomDismissScaleHandoff({
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
		[0, ZOOM_DISMISS_SCALE_ORBIT_DEPTH],
		"clamp",
	);
	const orbitScale = 1 - orbitDepth * Math.sin(Math.PI * closeProgress);

	return baseScale * orbitScale;
}

/* -------------------------------------------------------------------------- */
/*                             BUILD ZOOM STYLES                              */
/* -------------------------------------------------------------------------- */

export function buildZoomStyles({
	tag,
	zoomOptions,
	props,
}: BuildZoomStylesParams): ZoomInterpolatedStyle {
	"worklet";

	if (!tag) {
		return {};
	}

	/* ------------------------------ Shared Setup ------------------------------ */

	const target = zoomOptions?.target;
	const {
		focused,
		progress,
		layouts: { screen: screenLayout },
	} = props;

	const zoomAnchor = target === "bound" ? "center" : ZOOM_SHARED_OPTIONS.anchor;

	const boundsAccessor = createLinkAccessor(() => props);
	const link = boundsAccessor.getLink(tag);

	if (!link) return {};

	const baseRawOptions = {
		raw: true,
		scaleMode: ZOOM_SHARED_OPTIONS.scaleMode,
	} as const;

	const buildEffectiveTag = link.id;
	const sourceBorderRadius = getSourceBorderRadius(link);
	const targetBorderRadius = zoomOptions?.borderRadius ?? sourceBorderRadius;
	const focusedElementOpacity = {
		open: resolveOpacityRangeTuple({
			value: zoomOptions?.focusedElementOpacity?.open,
			fallback: ZOOM_FOCUSED_ELEMENT_OPEN_OPACITY_RANGE,
		}),
		close: resolveOpacityRangeTuple({
			value: zoomOptions?.focusedElementOpacity?.close,
			fallback: ZOOM_FOCUSED_ELEMENT_CLOSE_OPACITY_RANGE,
		}),
	};
	const unfocusedElementOpacity = {
		open: resolveOpacityRangeTuple({
			value: zoomOptions?.unfocusedElementOpacity?.open,
			fallback: ZOOM_UNFOCUSED_ELEMENT_OPEN_OPACITY_RANGE,
		}),
		close: resolveOpacityRangeTuple({
			value: zoomOptions?.unfocusedElementOpacity?.close,
			fallback: ZOOM_UNFOCUSED_ELEMENT_CLOSE_OPACITY_RANGE,
		}),
	};
	const sourceVisibilityStyle = {
		[buildEffectiveTag]: {
			style: VISIBLE_STYLE,
		},
	} satisfies TransitionInterpolatedStyle;
	const focusedContentSlot = props.current.layouts.navigationMaskEnabled
		? NAVIGATION_MASK_CONTAINER_STYLE_ID
		: "content";

	/* --------------------------- Gesture / Drag Values ------------------------- */

	const normX = props.active.gesture.normX;
	const normY = props.active.gesture.normY;
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

	const horizontalDragTranslation = resolveDragTranslationTuple(
		zoomOptions?.horizontalDragTranslation,
	);
	const verticalDragTranslation = resolveDragTranslationTuple(
		zoomOptions?.verticalDragTranslation,
	);
	const dragX = resolveDirectionalDragTranslation({
		translation: props.active.gesture.x,
		dimension: screenLayout.width,
		negativeMax: horizontalDragTranslation.negativeMax,
		positiveMax: horizontalDragTranslation.positiveMax,
		exponent: horizontalDragTranslation.exponent,
	});
	const dragY = resolveDirectionalDragTranslation({
		translation: props.active.gesture.y,
		dimension: screenLayout.height,
		negativeMax: verticalDragTranslation.negativeMax,
		positiveMax: verticalDragTranslation.positiveMax,
		exponent: verticalDragTranslation.exponent,
	});
	const horizontalDragScale = resolveDragScaleTuple(
		zoomOptions?.horizontalDragScale,
	);
	const verticalDragScale = resolveDragScaleTuple(
		zoomOptions?.verticalDragScale,
	);
	const backgroundScale = resolveBackgroundScale(zoomOptions?.backgroundScale);

	const dragXScale = isHorizontalDismiss
		? resolveDirectionalDragScale({
				normalized: normX,
				dismissDirection:
					initialGesture === "horizontal-inverted" ? "negative" : "positive",
				shrinkMin: horizontalDragScale.shrinkMin,
				growMax: horizontalDragScale.growMax,
				exponent: horizontalDragScale.exponent,
			})
		: IDENTITY_DRAG_SCALE_OUTPUT[0];
	const dragYScale = isVerticalDismiss
		? resolveDirectionalDragScale({
				normalized: normY,
				dismissDirection:
					initialGesture === "vertical-inverted" ? "negative" : "positive",
				shrinkMin: verticalDragScale.shrinkMin,
				growMax: verticalDragScale.growMax,
				exponent: verticalDragScale.exponent,
			})
		: IDENTITY_DRAG_SCALE_OUTPUT[1];
	const dragScale = combineScales(dragXScale, dragYScale);
	const handoffDragScale = props.active.gesture.dismissing
		? resolveZoomDismissScaleHandoff({
				progress: props.active.progress,
				releaseScale: dragScale,
				targetScale: 1,
				rawDrag,
			})
		: dragScale;
	const zoomGestureOptions = resolveZoomGestureOptions({
		rawDrag,
		activeOptions: props.active.options,
	});

	/* ----------------------------- Focused Screen ----------------------------- */

	if (focused) {
		const focusedContentTarget = getZoomContentTarget({
			explicitTarget: target,
			screenLayout,
			anchor: ZOOM_SHARED_OPTIONS.anchor,
			link,
		});

		const contentRaw = link.compute({
			...baseRawOptions,
			anchor: zoomAnchor,
			method: "content",
			target: focusedContentTarget,
		} as const);

		const maskRaw = link.compute({
			...baseRawOptions,
			anchor: ZOOM_SHARED_OPTIONS.anchor,
			method: "size",
			space: "absolute",
			target: "fullscreen",
		} as const);

		const focusedFade = props.active?.closing
			? interpolateOpacityRange({
					progress,
					range: focusedElementOpacity.close,
				})
			: interpolateOpacityRange({
					progress,
					range: focusedElementOpacity.open,
				});

		/**
		 * This is also how swiftui handles their navigation zoom.
		 * They remove clipping as soon as the screen stops animating
		 */
		const shouldRemoveClipping = !props.active.animating;
		const focusedMaskBorderRadius = interpolate(
			progress,
			[0, 1],
			[sourceBorderRadius, shouldRemoveClipping ? 0 : targetBorderRadius],
			"clamp",
		);

		const { top, right, bottom, left } = ZOOM_MASK_OUTSET;
		const maskWidth = Math.max(1, toNumber(maskRaw.width) + left + right);
		const maskHeight = Math.max(1, toNumber(maskRaw.height) + top + bottom);

		const contentTranslateX = toNumber(contentRaw.translateX) + dragX;
		const contentTranslateY = toNumber(contentRaw.translateY) + dragY;
		const contentScale = contentRaw.scale * handoffDragScale;
		const maskTranslateX = maskRaw.translateX + dragX - left;
		const maskTranslateY = maskRaw.translateY + dragY - top;

		const focusedContentStyle = {
			opacity: zoomOptions?.debug ? 0.5 : focusedFade,
			transform: [
				{ translateX: contentTranslateX },
				{ translateY: contentTranslateY },
				{ scale: contentScale },
			],
			borderRadius: focusedMaskBorderRadius,
			overflow: "hidden" as const,
		};

		const focusedStyles: ZoomInterpolatedStyle = {
			[focusedContentSlot]: {
				style: focusedContentStyle,
			},
			...sourceVisibilityStyle,
		};

		if (props.current.layouts.navigationMaskEnabled) {
			focusedStyles[NAVIGATION_MASK_ELEMENT_STYLE_ID] = {
				style: {
					width: maskWidth,
					height: maskHeight,
					borderRadius: focusedMaskBorderRadius,
					transform: [
						{ translateX: maskTranslateX },
						{ translateY: maskTranslateY },
						{ scale: handoffDragScale },
					],
				},
			};
		}

		return {
			options: zoomGestureOptions,
			...focusedStyles,
		};
	}

	/* ---------------------------- Unfocused Screen ---------------------------- */

	const unfocusedFade = props.active?.closing
		? interpolateOpacityRange({
				progress,
				range: unfocusedElementOpacity.close,
			})
		: interpolateOpacityRange({
				progress,
				range: unfocusedElementOpacity.open,
			});
	const unfocusedScale = interpolate(
		progress,
		[1, 2],
		[1, backgroundScale],
		"clamp",
	);
	const didSourceComponentVisiblyHide =
		!props.active.closing && unfocusedFade <= EPSILON;

	const shouldHideUnfocusedElement =
		!props.active.closing && didSourceComponentVisiblyHide;

	const unfocusedElementTarget = getZoomContentTarget({
		explicitTarget: target,
		screenLayout,
		anchor: ZOOM_SHARED_OPTIONS.anchor,
		link,
	});

	const elementRaw = link.compute({
		...baseRawOptions,
		anchor: zoomAnchor,
		method: "transform",
		space: "relative",
		target: unfocusedElementTarget,
	} as const);

	const boundTargetCenterX =
		target === "bound" && link.destination?.bounds
			? link.destination.bounds.pageX + link.destination.bounds.width / 2
			: undefined;
	const boundTargetCenterY =
		target === "bound" && link.destination?.bounds
			? link.destination.bounds.pageY + link.destination.bounds.height / 2
			: undefined;

	const elementCenterX =
		boundTargetCenterX ??
		(typeof unfocusedElementTarget === "object"
			? unfocusedElementTarget.pageX + unfocusedElementTarget.width / 2
			: screenLayout.width / 2);
	const elementCenterY =
		boundTargetCenterY ??
		(typeof unfocusedElementTarget === "object"
			? unfocusedElementTarget.pageY + unfocusedElementTarget.height / 2
			: screenLayout.height / 2);

	const unfocusedContentScale = props.active.logicallySettled
		? 1
		: unfocusedScale;
	const shouldTrackGestureTranslation = !props.active.logicallySettled;
	const shouldTrackGestureScale = !props.active.logicallySettled;
	const elementGestureScale = shouldTrackGestureScale ? handoffDragScale : 1;
	const elementGestureX = shouldTrackGestureTranslation ? dragX : 0;
	const elementGestureY = shouldTrackGestureTranslation ? dragY : 0;
	const safeUnfocusedContentScale = Math.max(
		Math.abs(unfocusedContentScale),
		EPSILON,
	);

	const scaleShiftX = computeCenterScaleShift({
		center: elementCenterX,
		containerCenter: screenLayout.width / 2,
		scale: elementGestureScale,
	});
	const scaleShiftY = computeCenterScaleShift({
		center: elementCenterY,
		containerCenter: screenLayout.height / 2,
		scale: elementGestureScale,
	});

	const compensatedGestureX = composeCompensatedTranslation({
		gesture: elementGestureX,
		parentScale: unfocusedContentScale,
		centerShift: scaleShiftX,
		epsilon: EPSILON,
	});
	const compensatedGestureY = composeCompensatedTranslation({
		gesture: elementGestureY,
		parentScale: unfocusedContentScale,
		centerShift: scaleShiftY,
		epsilon: EPSILON,
	});

	const elementTranslateX =
		toNumber(elementRaw.translateX) + compensatedGestureX;
	const elementTranslateY =
		toNumber(elementRaw.translateY) + compensatedGestureY;
	const elementScaleX =
		(toNumber(elementRaw.scaleX, 1) * elementGestureScale) /
		safeUnfocusedContentScale;
	const elementScaleY =
		(toNumber(elementRaw.scaleY, 1) * elementGestureScale) /
		safeUnfocusedContentScale;

	const resolvedElementStyle = shouldHideUnfocusedElement
		? {
				transform: [
					{ translateX: 0 },
					{ translateY: 0 },
					{ scaleX: 1 },
					{ scaleY: 1 },
				],
				opacity: zoomOptions?.debug ? 1 : 0,
				zIndex: 0,
				elevation: 0,
			}
		: {
				transform: [
					{
						translateX: elementTranslateX,
					},
					{
						translateY: elementTranslateY,
					},
					{
						scaleX: elementScaleX,
					},
					{
						scaleY: elementScaleY,
					},
				],
				opacity: zoomOptions?.debug ? 1 : unfocusedFade,
				zIndex: 9999,
				elevation: 9999,
			};

	return {
		options: zoomGestureOptions,
		content: {
			style: {
				transform: [{ scale: unfocusedContentScale }],
			},
		},
		[buildEffectiveTag]: {
			style: resolvedElementStyle,
		},
	};
}
