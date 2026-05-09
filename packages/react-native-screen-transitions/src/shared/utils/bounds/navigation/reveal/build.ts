import { interpolate } from "react-native-reanimated";
import {
	EPSILON,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	VISIBLE_STYLE,
} from "../../../../constants";
import type { TransitionInterpolatedStyle } from "../../../../types/animation.types";
import { createNavigationBoundsAccessor } from "../helpers";
import {
	REVEAL_BORDER_RADIUS,
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
import { getSourceBorderRadius } from "./helpers";
import {
	combineScales,
	composeCompensatedTranslation,
	computeCenterScaleShift,
	resolveDirectionalDragScale,
	resolveDirectionalDragTranslation,
} from "./math";
import type { BuildRevealStylesParams, RevealInterpolatedStyle } from "./types";

const IDENTITY_DRAG_SCALE_OUTPUT = [1, 1] as const;

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
		id: tag,
		raw: true,
		scaleMode: ZOOM_SHARED_OPTIONS.scaleMode,
	} as const;

	const boundsAccessor = createNavigationBoundsAccessor(() => {
		"worklet";
		return props;
	});
	const bounds = boundsAccessor(baseRawOptions);
	const currentLink = bounds.getLink();

	if (!currentLink?.source?.bounds || !currentLink.destination?.bounds) {
		return {};
	}

	const snapshotLink =
		focused && props.active.closing
			? bounds.getLink({ snapshot: "initial" })
			: null;
	const link =
		focused && props.active.closing && snapshotLink?.destination?.bounds
			? snapshotLink
			: currentLink;

	if (!link.destination) {
		return {};
	}

	const frozenDestinationTarget =
		focused && props.active.closing && snapshotLink?.destination?.bounds
			? snapshotLink.destination.bounds
			: undefined;

	const sourceBorderRadius = getSourceBorderRadius(link);

	const focusedElementOffsetX =
		focused && props.active.closing && currentLink.destination?.bounds
			? link.destination.bounds.pageX - currentLink.destination.bounds.pageX
			: 0;

	const focusedElementOffsetY =
		focused && props.active.closing && currentLink.destination?.bounds
			? link.destination.bounds.pageY - currentLink.destination.bounds.pageY
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

	const sourceVisibilityStyle = {
		[tag]: {
			style: VISIBLE_STYLE,
		},
	} satisfies TransitionInterpolatedStyle;

	/* --------------------------- Gesture / Drag Values ------------------------- */

	const normX = props.active.gesture.normX;
	const normY = props.active.gesture.normY;
	const gestureX = props.active.gesture.x;
	const gestureY = props.active.gesture.y;
	const rawNormX = props.active.gesture.raw.normX;
	const rawNormY = props.active.gesture.raw.normY;
	const initialGesture =
		props.active.gesture.active ?? props.active.gesture.direction;

	const isHorizontalDismiss = initialGesture?.includes("horizontal");
	const isVerticalDismiss = initialGesture?.includes("vertical");

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
		const contentRaw = boundsAccessor({
			...baseRawOptions,
			method: "content",
			...(frozenDestinationTarget ? { target: frozenDestinationTarget } : {}),
		} as const);

		const maskRaw = boundsAccessor({
			...baseRawOptions,
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
			[sourceBorderRadius, props.active.settled ? 0 : REVEAL_BORDER_RADIUS],
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

		const focusedStyles: RevealInterpolatedStyle = {
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
			[tag]: {
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

	const elementRaw = boundsAccessor({
		...baseRawOptions,
		method: "transform",
		space: "relative",
		...(frozenDestinationTarget ? { target: frozenDestinationTarget } : {}),
	} as const);

	const destinationBounds = link.destination.bounds;
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
		[tag]: {
			style: resolvedElementStyle,
		},
	};
}
