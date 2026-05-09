import { interpolate } from "react-native-reanimated";
import {
	EPSILON,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	VISIBLE_STYLE,
} from "../../../constants";
import { BoundStore } from "../../../stores/bounds";
import type { TransitionInterpolatedStyle } from "../../../types/animation.types";
import { prepareBoundStyles } from "../helpers/prepare-bound-styles";
import type { BoundsOptions } from "../types/options";
import {
	CONTAINER_REVEAL_BORDER_RADIUS,
	toNumber,
	ZOOM_DRAG_DIRECTIONAL_SCALE_EXPONENT,
	ZOOM_DRAG_DIRECTIONAL_SCALE_MAX,
	ZOOM_DRAG_DIRECTIONAL_SCALE_MIN,
	ZOOM_DRAG_TRANSLATION_EXPONENT,
	ZOOM_DRAG_TRANSLATION_NEGATIVE_MAX,
	ZOOM_DRAG_TRANSLATION_POSITIVE_MAX,
	ZOOM_MASK_OUTSET,
	ZOOM_SHARED_OPTIONS,
} from "./config";
import {
	getSourceBorderRadius,
	resolveFrozenDestinationPair,
	resolvePresentedZoomTag,
} from "./helpers";
import {
	combineScales,
	composeCompensatedTranslation,
	computeCenterScaleShift,
	resolveDirectionalDragScale,
	resolveDirectionalDragTranslation,
} from "./math";
import type {
	BuildContainerRevealStylesParams,
	ContainerRevealInterpolatedStyle,
} from "./types";

const IDENTITY_DRAG_SCALE_OUTPUT = [1, 1] as const;

/* -------------------------------------------------------------------------- */
/*                       BUILD CONTAINER REVEAL STYLES                        */
/* -------------------------------------------------------------------------- */

export function buildContainerRevealStyles({
	tag,
	props,
}: BuildContainerRevealStylesParams): ContainerRevealInterpolatedStyle {
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

	const linkPair = focused
		? resolveFrozenDestinationPair({
				cacheKey: `${activeRouteKey}:${buildEffectiveTag}`,
				pair: presented.pair,
				closing: !!props.active.closing,
			})
		: presented.pair;

	if (!linkPair.sourceBounds || !linkPair.destinationBounds) {
		return {};
	}

	const focusedElementOffsetX =
		focused && props.active.closing && presented.pair.destinationBounds
			? linkPair.destinationBounds.pageX -
				presented.pair.destinationBounds.pageX
			: 0;
	const focusedElementOffsetY =
		focused && props.active.closing && presented.pair.destinationBounds
			? linkPair.destinationBounds.pageY -
				presented.pair.destinationBounds.pageY
			: 0;
	const focusedElementTranslateX = props.active.closing
		? interpolate(
				props.active.progress,
				[0, 1],
				[focusedElementOffsetX, 0],
				"clamp",
			)
		: focusedElementOffsetX;
	const focusedElementTranslateY = props.active.closing
		? interpolate(
				props.active.progress,
				[0, 1],
				[focusedElementOffsetY, 0],
				"clamp",
			)
		: focusedElementOffsetY;

	const sourceBorderRadius = getSourceBorderRadius(linkPair);

	const sourceVisibilityStyle = {
		[buildEffectiveTag]: {
			style: VISIBLE_STYLE,
		},
	} satisfies TransitionInterpolatedStyle;

	/**
	 * Local bounds compute helper for container reveal.
	 *
	 * If you're building a custom transition, prefer the public `bounds()` helper.
	 * We keep a local version here so container reveal can share the same
	 * low-level compute path without re-entering the decorated public accessor.
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
	const gestureX = props.active.gesture.x;
	const gestureY = props.active.gesture.y;
	const rawNormX = props.active.gesture.raw.normX;
	const rawNormY = props.active.gesture.raw.normY;
	const initialGesture =
		props.active.gesture.active ?? props.active.gesture.direction;
	const isHorizontalDismiss =
		initialGesture === "horizontal" || initialGesture === "horizontal-inverted";
	const isVerticalDismiss =
		initialGesture === "vertical" || initialGesture === "vertical-inverted";
	const rawDrag = isHorizontalDismiss
		? Math.abs(rawNormX)
		: isVerticalDismiss
			? Math.abs(rawNormY)
			: 0;
	const gestureSensitivity = interpolate(
		rawDrag,
		[0, 0.5],
		[0.9, 0.25],
		"clamp",
	);

	const dragX = resolveDirectionalDragTranslation({
		translation: gestureX,
		dimension: screenLayout.width,
		negativeMax: ZOOM_DRAG_TRANSLATION_NEGATIVE_MAX,
		positiveMax: ZOOM_DRAG_TRANSLATION_POSITIVE_MAX,
		exponent: ZOOM_DRAG_TRANSLATION_EXPONENT,
	});
	const dragY = resolveDirectionalDragTranslation({
		translation: gestureY,
		dimension: screenLayout.height,
		negativeMax: ZOOM_DRAG_TRANSLATION_NEGATIVE_MAX,
		positiveMax: ZOOM_DRAG_TRANSLATION_POSITIVE_MAX,
		exponent: ZOOM_DRAG_TRANSLATION_EXPONENT,
	});
	const dragXScale = isHorizontalDismiss
		? resolveDirectionalDragScale({
				normalized: normX,
				dismissDirection:
					initialGesture === "horizontal-inverted" ? "negative" : "positive",
				shrinkMin: ZOOM_DRAG_DIRECTIONAL_SCALE_MIN,
				growMax: ZOOM_DRAG_DIRECTIONAL_SCALE_MAX,
				exponent: ZOOM_DRAG_DIRECTIONAL_SCALE_EXPONENT,
			})
		: IDENTITY_DRAG_SCALE_OUTPUT[0];
	const dragYScale = isVerticalDismiss
		? resolveDirectionalDragScale({
				normalized: normY,
				dismissDirection:
					initialGesture === "vertical-inverted" ? "negative" : "positive",
				shrinkMin: ZOOM_DRAG_DIRECTIONAL_SCALE_MIN,
				growMax: ZOOM_DRAG_DIRECTIONAL_SCALE_MAX,
				exponent: ZOOM_DRAG_DIRECTIONAL_SCALE_EXPONENT,
			})
		: IDENTITY_DRAG_SCALE_OUTPUT[1];
	const dragScale = combineScales(dragXScale, dragYScale);

	/* ----------------------------- Focused Screen ----------------------------- */

	if (focused) {
		const contentRaw = bounds({
			...baseRawOptions,
			anchor: ZOOM_SHARED_OPTIONS.anchor,
			method: "content",
		} as const);

		const maskRaw = bounds({
			...baseRawOptions,
			anchor: ZOOM_SHARED_OPTIONS.anchor,
			method: "size",
			space: "absolute",
			target: "fullscreen",
		} as const);

		/**
		 * This is also how swiftui handles their navigation zoom.
		 * They remove clipping as soon as the screen stops animating
		 */
		const focusedMaskBorderRadius = interpolate(
			progress,
			[0, 1],
			[
				sourceBorderRadius,
				props.active.settled ? 0 : CONTAINER_REVEAL_BORDER_RADIUS,
			],
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
		const safeContentScale =
			Math.abs(contentScale) > EPSILON ? contentScale : 1;
		const maskCenterX = maskWidth / 2;
		const maskCenterY = maskHeight / 2;
		const contentCenterX = screenLayout.width / 2;
		const contentCenterY = screenLayout.height / 2;

		const compensatedMaskTranslateX =
			(maskTranslateX -
				contentTranslateX +
				(1 - contentScale) * (maskCenterX - contentCenterX)) /
			safeContentScale;
		const compensatedMaskTranslateY =
			(maskTranslateY -
				contentTranslateY +
				(1 - contentScale) * (maskCenterY - contentCenterY)) /
			safeContentScale;
		const compensatedMaskScale = dragScale / safeContentScale;

		const focusedStyles: ContainerRevealInterpolatedStyle = {
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
					pointerEvents: props.active.logicallySettled ? "auto" : "none",
				},
			},
			...sourceVisibilityStyle,
		};

		if (props.current.layouts.navigationMaskEnabled) {
			focusedStyles[NAVIGATION_MASK_ELEMENT_STYLE_ID] = {
				style: {
					width: maskWidth,
					height: maskHeight,
					borderRadius: focusedMaskBorderRadius,
					borderCurve: "continuous",
					transform: [
						{ translateX: compensatedMaskTranslateX },
						{ translateY: compensatedMaskTranslateY },
						{ scale: compensatedMaskScale },
					],
				},
			};
		}

		return {
			...focusedStyles,
			[buildEffectiveTag]: {
				style: {
					...VISIBLE_STYLE,
					position: "relative",
					zIndex: 999,
					transform: [
						{ translateX: focusedElementTranslateX },
						{ translateY: focusedElementTranslateY },
					],
				},
			},
			options: {
				gestureDrivesProgress: false,
				gestureSensitivity,
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

	const elementRaw = bounds({
		...baseRawOptions,
		method: "transform",
		space: "relative",
	} as const);

	const destinationBounds = linkPair.destinationBounds;
	const elementCenterX = destinationBounds.pageX + destinationBounds.width / 2;
	const elementCenterY = destinationBounds.pageY + destinationBounds.height / 2;

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

	const shouldShowUnfocusedElement =
		props.active.entering ||
		(props.active.closing && props.active.logicallySettled);

	const resolvedElementStyle = !shouldShowUnfocusedElement
		? {
				transform: [
					{ translateX: 0 },
					{ translateY: 0 },
					{ scaleX: 1 },
					{ scaleY: 1 },
				],
				opacity: 0,
				zIndex: 0,
				elevation: 0,
			}
		: {
				transform: [
					{ translateX: elementTranslateX },
					{ translateY: elementTranslateY },
					{ scaleX: elementScaleX },
					{ scaleY: elementScaleY },
				],
				zIndex: 9999,
				elevation: 9999,
			};

	return {
		content: {
			style: {
				transform: [{ scale: props.active.settled ? 1 : unfocusedScale }],
			},
			props: {
				pointerEvents: "none",
			},
		},
		[buildEffectiveTag]: {
			style: resolvedElementStyle,
		},
	};
}
