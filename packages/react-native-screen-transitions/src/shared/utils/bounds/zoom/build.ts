import { interpolate } from "react-native-reanimated";
import {
	EPSILON,
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	VISIBLE_STYLE,
} from "../../../constants";
import { BoundStore } from "../../../stores/bounds";
import type { TransitionInterpolatedStyle } from "../../../types/animation.types";
import { prepareBoundStyles } from "../helpers/prepare-bound-styles";
import type { BoundsOptions } from "../types/options";
import {
	toNumber,
	ZOOM_DRAG_RESISTANCE,
	ZOOM_FOCUSED_ELEMENT_CLOSE_OPACITY_RANGE,
	ZOOM_FOCUSED_ELEMENT_OPEN_OPACITY_RANGE,
	ZOOM_MASK_OUTSET,
	ZOOM_SHARED_OPTIONS,
	ZOOM_UNFOCUSED_ELEMENT_CLOSE_OPACITY_RANGE,
	ZOOM_UNFOCUSED_ELEMENT_OPEN_OPACITY_RANGE,
} from "./config";
import {
	getSourceBorderRadius,
	getZoomContentTarget,
	interpolateOpacityRange,
	resolveBackgroundScale,
	resolveDragScaleTuple,
	resolveDragTranslationTuple,
	resolvePresentedZoomTag,
} from "./helpers";
import {
	combineScales,
	composeCompensatedTranslation,
	computeCenterScaleShift,
	resolveDirectionalDragScale,
	resolveDirectionalDragTranslation,
	resolveOpacityRangeTuple,
} from "./math";
import type { BuildZoomStylesParams, ZoomInterpolatedStyle } from "./types";

const IDENTITY_DRAG_SCALE_OUTPUT = [1, 1] as const;

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

	const isGroup = tag.includes(":");
	let buildEffectiveTag = tag;
	if (isGroup) {
		const group = tag.split(":")[0];
		const groupActiveTag = BoundStore.group.getActiveId(group)?.split(":")[0];
		buildEffectiveTag = `${group}:${groupActiveTag ?? tag.split(":")[1]}`;
	}

	/* ------------------------------ Shared Setup ------------------------------ */

	const target = zoomOptions?.target;
	const {
		focused,
		progress,
		layouts: { screen: screenLayout },
	} = props;
	const isEnteringTransition = !props.next;
	const currentRouteKey = props.current?.route.key;
	const previousRouteKey = props.previous?.route.key;
	const nextRouteKey = props.next?.route.key;
	const activeRouteKey = props.active.route.key;

	const zoomAnchor = target === "bound" ? "center" : ZOOM_SHARED_OPTIONS.anchor;

	const requestedPair = BoundStore.link.getPair(buildEffectiveTag, {
		currentScreenKey: currentRouteKey,
		previousScreenKey: previousRouteKey,
		nextScreenKey: nextRouteKey,
		entering: isEnteringTransition,
	});
	const presented = resolvePresentedZoomTag({
		requestedTag: buildEffectiveTag,
		activeRouteKey,
		requestedPair,
		currentScreenKey: currentRouteKey,
		previousScreenKey: previousRouteKey,
		nextScreenKey: nextRouteKey,
		entering: isEnteringTransition,
	});

	// Grouped zoom can retarget before the new active member has measured.
	// Keep presenting the last measured tag so mask/content styles stay stable.
	buildEffectiveTag = presented.tag;

	const baseRawOptions = {
		id: buildEffectiveTag,
		raw: true,
		scaleMode: ZOOM_SHARED_OPTIONS.scaleMode,
	} as const;

	const linkPair = presented.pair;

	const sourceBorderRadius = getSourceBorderRadius(linkPair);
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

	/**
	 * Local bounds compute helper for navigation zoom.
	 *
	 * If you're building a custom transition, prefer the public `bounds()` helper.
	 * We keep a local version here so zoom can share the same low-level compute path
	 * without re-entering the decorated public accessor.
	 */
	const bounds = <T extends BoundsOptions>(options: T) => {
		"worklet";

		return prepareBoundStyles({
			props,
			options,
			resolvedPair: linkPair,
		});
	};

	/* --------------------------- Gesture / Drag Values ------------------------- */

	const normX = props.active.gesture.normX;
	const normY = props.active.gesture.normY;
	const initialGesture =
		props.active.gesture.active ?? props.active.gesture.direction;
	const isHorizontalDismiss =
		initialGesture === "horizontal" || initialGesture === "horizontal-inverted";
	const isVerticalDismiss =
		initialGesture === "vertical" || initialGesture === "vertical-inverted";

	const horizontalDragTranslation = resolveDragTranslationTuple(
		zoomOptions?.horizontalDragTranslation,
	);
	const verticalDragTranslation = resolveDragTranslationTuple(
		zoomOptions?.verticalDragTranslation,
	);
	const dragX = resolveDirectionalDragTranslation({
		normalized: normX,
		dimension: screenLayout.width,
		resistance: ZOOM_DRAG_RESISTANCE,
		negativeMax: horizontalDragTranslation.negativeMax,
		positiveMax: horizontalDragTranslation.positiveMax,
		exponent: horizontalDragTranslation.exponent,
	});
	const dragY = resolveDirectionalDragTranslation({
		normalized: normY,
		dimension: screenLayout.height,
		resistance: ZOOM_DRAG_RESISTANCE,
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

	/* ----------------------------- Focused Screen ----------------------------- */

	if (focused) {
		const focusedContentTarget = getZoomContentTarget({
			explicitTarget: target,
			screenLayout,
			anchor: ZOOM_SHARED_OPTIONS.anchor,
			resolvedPair: linkPair,
		});

		const contentRaw = bounds({
			...baseRawOptions,
			anchor: zoomAnchor,
			method: "content",
			target: focusedContentTarget,
		} as const);

		const maskRaw = bounds({
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
		const contentScale = toNumber(contentRaw.scale, 1) * dragScale;
		const maskTranslateX = toNumber(maskRaw.translateX) + dragX - left;
		const maskTranslateY = toNumber(maskRaw.translateY) + dragY - top;

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
						{ scale: dragScale },
					],
				},
			};
		}

		return focusedStyles;
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
		resolvedPair: linkPair,
	});

	const elementRaw = bounds({
		...baseRawOptions,
		anchor: zoomAnchor,
		method: "transform",
		space: "relative",
		target: unfocusedElementTarget,
	} as const);

	const boundTargetCenterX =
		target === "bound" && linkPair.destinationBounds
			? linkPair.destinationBounds.pageX + linkPair.destinationBounds.width / 2
			: undefined;
	const boundTargetCenterY =
		target === "bound" && linkPair.destinationBounds
			? linkPair.destinationBounds.pageY + linkPair.destinationBounds.height / 2
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

	const scaleShiftX = computeCenterScaleShift({
		center: elementCenterX,
		containerCenter: screenLayout.width / 2,
		scale: dragScale,
	});
	const scaleShiftY = computeCenterScaleShift({
		center: elementCenterY,
		containerCenter: screenLayout.height / 2,
		scale: dragScale,
	});

	const compensatedGestureX = composeCompensatedTranslation({
		gesture: dragX,
		parentScale: unfocusedScale,
		centerShift: scaleShiftX,
		epsilon: EPSILON,
	});
	const compensatedGestureY = composeCompensatedTranslation({
		gesture: dragY,
		parentScale: unfocusedScale,
		centerShift: scaleShiftY,
		epsilon: EPSILON,
	});

	const elementTranslateX =
		toNumber(elementRaw.translateX) + compensatedGestureX;
	const elementTranslateY =
		toNumber(elementRaw.translateY) + compensatedGestureY;
	const elementScaleX = toNumber(elementRaw.scaleX, 1) * dragScale;
	const elementScaleY = toNumber(elementRaw.scaleY, 1) * dragScale;

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
		content: {
			style: {
				transform: [{ scale: unfocusedScale }],
			},
		},
		[buildEffectiveTag]: {
			style: resolvedElementStyle,
		},
	};
}
