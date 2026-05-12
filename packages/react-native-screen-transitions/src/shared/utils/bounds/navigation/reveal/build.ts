import { interpolate } from "react-native-reanimated";
import {
	EPSILON,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../../constants";
import { createLinkAccessor } from "../../helpers/create-link-accessor";
import { getSourceBorderRadius } from "../helpers";
import {
	combineScales,
	composeCompensatedTranslation,
	computeCenterScaleShift,
	resolveDirectionalDragScale,
} from "../math";
import {
	REVEAL_BORDER_RADIUS,
	ZOOM_DRAG_DIRECTIONAL_SCALE_EXPONENT,
	ZOOM_DRAG_DIRECTIONAL_SCALE_MAX,
	ZOOM_DRAG_DIRECTIONAL_SCALE_MIN,
	ZOOM_DRAG_TRANSLATION_EXPONENT,
	ZOOM_DRAG_TRANSLATION_NEGATIVE_MAX,
	ZOOM_DRAG_TRANSLATION_POSITIVE_MAX,
	ZOOM_SHARED_OPTIONS,
} from "./config";
import { resolveDirectionalDragTranslation } from "./math";
import type { BuildRevealStylesParams, RevealInterpolatedStyle } from "./types";

const IDENTITY_DRAG_SCALE_OUTPUT = [1, 1] as const;

function resolveRevealGestureHandoff(rawDrag: number) {
	"worklet";

	const gestureSensitivity = interpolate(rawDrag, [0, 1], [0.8, 0.2], "clamp");

	const releaseBoost = interpolate(rawDrag, [0, 1], [1, 1.6], "clamp");

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
		scaleMode: ZOOM_SHARED_OPTIONS.scaleMode,
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
		negativeMax: ZOOM_DRAG_TRANSLATION_NEGATIVE_MAX,
		positiveMax: ZOOM_DRAG_TRANSLATION_POSITIVE_MAX,
		exponent: ZOOM_DRAG_TRANSLATION_EXPONENT,
	});

	const dragY = resolveDirectionalDragTranslation({
		translation: props.active.gesture.y,
		dimension: screenLayout.height,
		negativeMax: ZOOM_DRAG_TRANSLATION_NEGATIVE_MAX,
		positiveMax: ZOOM_DRAG_TRANSLATION_POSITIVE_MAX,
		exponent: ZOOM_DRAG_TRANSLATION_EXPONENT,
	});

	const dragXScale = isHorizontalDismiss
		? resolveDirectionalDragScale({
				normalized: props.active.gesture.normX,
				dismissDirection:
					initialGesture === "horizontal-inverted" ? "negative" : "positive",
				shrinkMin: ZOOM_DRAG_DIRECTIONAL_SCALE_MIN,
				growMax: ZOOM_DRAG_DIRECTIONAL_SCALE_MAX,
				exponent: ZOOM_DRAG_DIRECTIONAL_SCALE_EXPONENT,
			})
		: IDENTITY_DRAG_SCALE_OUTPUT[0];

	const dragYScale = isVerticalDismiss
		? resolveDirectionalDragScale({
				normalized: props.active.gesture.normY,
				dismissDirection:
					initialGesture === "vertical-inverted" ? "negative" : "positive",
				shrinkMin: ZOOM_DRAG_DIRECTIONAL_SCALE_MIN,
				growMax: ZOOM_DRAG_DIRECTIONAL_SCALE_MAX,
				exponent: ZOOM_DRAG_DIRECTIONAL_SCALE_EXPONENT,
			})
		: IDENTITY_DRAG_SCALE_OUTPUT[1];

	const dragScale = combineScales(dragXScale, dragYScale);

	const initialDestinationTarget =
		focused && props.active.closing && link.initialDestination?.bounds
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

		const maskWidth = Math.max(1, maskRaw.width);
		const maskHeight = Math.max(1, maskRaw.height);

		const contentTranslateX = contentRaw.translateX + dragX;
		const contentTranslateY = contentRaw.translateY + dragY;
		const contentScale = contentRaw.scale * dragScale;

		const maskTranslateX = maskRaw.translateX + dragX;
		const maskTranslateY = maskRaw.translateY + dragY;

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

		const elementOffsetX = initialDestinationTarget
			? initialDestinationTarget.pageX - link.destination.bounds.pageX
			: 0;

		const elementOffsetY = initialDestinationTarget
			? initialDestinationTarget.pageY - link.destination.bounds.pageY
			: 0;

		const elementTX = props.active.closing
			? interpolate(props.active.progress, [0, 1], [elementOffsetX, 0], "clamp")
			: elementOffsetX;

		const elementY = props.active.closing
			? interpolate(props.active.progress, [0, 1], [elementOffsetY, 0], "clamp")
			: elementOffsetY;

		const { gestureSensitivity, gestureReleaseVelocityScale } =
			resolveRevealGestureHandoff(rawDrag);

		return {
			options: {
				gestureDrivesProgress: false,
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
					// pointerEvents: props.active.logicallySettled ? "auto" : "none",
				},
			},
			[NAVIGATION_MASK_ELEMENT_STYLE_ID]: {
				style: {
					width: maskWidth,
					height: maskHeight,
					borderRadius: props.active.settled ? 0 : maskBorderRadius,
					borderCurve: "continuous",
					transform: [
						{ translateX: compensatedMaskTranslateX },
						{ translateY: compensatedMaskTranslateY },
						{ scale: compensatedMaskScale },
					],
				},
			},
			[link.id]: {
				style: {
					position: "relative",
					opacity: 1,
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

	const elementRaw = link.compute({
		...baseRawOptions,
		method: "transform",
		space: "relative",
		target: initialDestinationTarget,
	});

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

	const elementTranslateX = elementRaw.translateX + compensatedGestureX;
	const elementTranslateY = elementRaw.translateY + compensatedGestureY;
	const elementScaleX = elementRaw.scaleX * dragScale;
	const elementScaleY = elementRaw.scaleY * dragScale;

	const shouldShowUnfocusedElement =
		props.active.entering || (props.active.closing && !props.active.settled);

	return {
		content: {
			style: {
				transform: [{ scale: props.active.settled ? 1 : unfocusedScale }],
			},
			// props: {
			// 	pointerEvents: "none",
			// },
		},
		[link.id]: {
			style: {
				transform: [
					{ translateX: !shouldShowUnfocusedElement ? 0 : elementTranslateX },
					{ translateY: !shouldShowUnfocusedElement ? 0 : elementTranslateY },
					{ scaleX: !shouldShowUnfocusedElement ? 1 : elementScaleX },
					{ scaleY: !shouldShowUnfocusedElement ? 1 : elementScaleY },
				],
				opacity: !shouldShowUnfocusedElement ? 0 : 1,
				zIndex: 9999,
				elevation: 9999,
			},
		},
	};
}
