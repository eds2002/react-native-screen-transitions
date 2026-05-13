import { interpolate } from "react-native-reanimated";
import {
	EPSILON,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../../constants";
import { createLinkAccessor } from "../../helpers/create-link-accessor";
import { getSourceBorderRadius } from "../helpers";
import { combineScales, resolveDirectionalDragScale } from "../math";
import {
	DISMISS_SCALE_ORBIT_DEPTH,
	DRAG_DIRECTIONAL_SCALE_EXPONENT,
	DRAG_DIRECTIONAL_SCALE_MAX,
	DRAG_DIRECTIONAL_SCALE_MIN,
	DRAG_MASK_HEIGHT_COLLAPSE_END,
	REVEAL_BORDER_RADIUS,
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

	const gestureSensitivity = interpolate(rawDrag, [0, 1], [0.8, 0.2], "clamp");

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
		focused && props.active.closing && link.initialDestination?.bounds
			? link.initialDestination.bounds
			: undefined;

	const isClosingLogicallySettled =
		props.active.entering ||
		(props.active.closing && props.active.logicallySettled);

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

		const contentTranslateX = contentRaw.translateX + dragX;
		const contentTranslateY = contentRaw.translateY + dragY;
		const contentScale = props.active.gesture.dismissing
			? resolveDismissScaleHandoff({
					progress: props.active.progress,
					releaseScale: dragScale,
					targetScale: sourceContentScale,
					rawDrag,
				})
			: contentBaseScale * dragScale;

		const liveVerticalDismissDrag =
			initialGesture === "vertical-inverted"
				? -props.active.gesture.normY
				: props.active.gesture.normY;

		const rawVerticalDismissDrag =
			initialGesture === "vertical-inverted"
				? -props.active.gesture.raw.normY
				: props.active.gesture.raw.normY;

		const verticalDismissDrag = props.active.gesture.dismissing
			? rawVerticalDismissDrag
			: liveVerticalDismissDrag;

		const dismissProgressDrag = props.active.gesture.dismissing
			? 1 - props.active.progress
			: 0;

		const maskHeightCollapseDrag = isVerticalDismiss
			? Math.max(0, verticalDismissDrag, dismissProgressDrag)
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

		const contentCenterX = screenLayout.width / 2;
		const contentCenterY = screenLayout.height / 2;

		// The mask lives inside the transformed content container. Compensate only
		// for the reveal's base content scale; drag scale should be inherited from
		// the same parent transform as the screen content.
		const compensatedMaskTranslateX =
			(maskRaw.translateX -
				contentRaw.translateX +
				(1 - contentBaseScale) * (maskCenterX - contentCenterX)) /
			safeContentBaseScale;

		const compensatedMaskTranslateY =
			(maskRaw.translateY -
				contentRaw.translateY +
				(1 - contentBaseScale) * (maskCenterY - contentCenterY)) /
			safeContentBaseScale;

		const compensatedMaskScale = 1 / safeContentBaseScale;

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
					opacity: !props.active.entering && isClosingLogicallySettled ? 0 : 1,
				},
			},
			[NAVIGATION_MASK_ELEMENT_STYLE_ID]: {
				style: {
					width: maskWidth,
					height: renderedMaskHeight,
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

	return {
		options: {
			gestureDrivesProgress: false,
		},
		content: {
			style: {
				transform: [
					{ scale: props.active.logicallySettled ? 1 : unfocusedScale },
				],
			},
			props: {
				pointerEvents:
					props.active.closing && props.active.logicallySettled
						? "auto"
						: "none",
			},
		},
		[link.id]: {
			style: {
				opacity: props.active.entering ? 0 : !isClosingLogicallySettled ? 0 : 1,
				zIndex: 9999,
				elevation: 9999,
			},
		},
	};
}
